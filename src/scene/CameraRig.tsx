import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import type { Flight } from '../lib/flight';
import { GLOBE_RADIUS } from './Globe';
import { SATELLITE_ALTITUDE } from './Satellite';

interface CameraRigProps {
  flightRef: React.MutableRefObject<Flight>;
  zoom: number; // 0 = far, 1 = close
  isLanding: boolean;
  intro: boolean;
  landTarget: { lat: number; lng: number } | null;
}

const MIN_DIST = 1.4;
const MAX_DIST = 9;

export default function CameraRig({ flightRef, zoom, isLanding, intro, landTarget }: CameraRigProps) {
  const { camera, clock } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  // Reusable temporaries to avoid per-frame allocations.
  const tmp = useMemo(
    () => ({
      satPos: new THREE.Vector3(),
      groundPos: new THREE.Vector3(),
      up: new THREE.Vector3(),
      north: new THREE.Vector3(0, 1, 0),
      east: new THREE.Vector3(),
      trueNorth: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      goalPos: new THREE.Vector3(),
      goalLook: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const f = flightRef.current;

    // Frame-rate-independent smoothing: k is per-second stiffness, tuned so the feel
    // matches the old fixed per-frame lerp factors at 60fps. Fixed factors converge
    // twice as fast on 120Hz displays and hitch when frame timing varies.
    const dt = Math.min(delta, 0.1);
    const ease = (k: number) => 1 - Math.exp(-k * dt);

    // Intro: a slow, wide cinematic orbit around the whole planet. Easing the camera
    // toward this target means the hand-off to the chase cam on launch is seamless.
    if (intro) {
      const t = clock.getElapsedTime();
      const az = t * 0.05;
      const dist = 8.4;
      tmp.goalPos.set(Math.sin(az) * dist, 3.0 + Math.sin(t * 0.16) * 0.35, Math.cos(az) * dist);
      targetPos.current.lerp(tmp.goalPos, ease(2.5));
      targetLook.current.lerp(tmp.goalLook.set(0, 0, 0), ease(3.7));
      camera.position.lerp(targetPos.current, ease(3.7));
      camera.lookAt(targetLook.current);
      return;
    }
    const headingRad = f.heading * (Math.PI / 180);
    const satPos = latLngToVector3(f.lat, f.lng, GLOBE_RADIUS + SATELLITE_ALTITUDE, tmp.satPos);
    const groundPos = latLngToVector3(f.lat, f.lng, GLOBE_RADIUS, tmp.groundPos);
    const up = tmp.up.copy(satPos).normalize();

    const east = tmp.east.crossVectors(tmp.north, up).normalize();
    const trueNorth = tmp.trueNorth.crossVectors(up, east).normalize();

    const forward = tmp.forward
      .copy(trueNorth)
      .multiplyScalar(Math.cos(headingRad))
      .addScaledVector(east, Math.sin(headingRad))
      .normalize();

    if (isLanding && landTarget) {
      const landPos = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS + 0.45, tmp.goalPos);
      const landGround = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS, tmp.goalLook);
      targetPos.current.lerp(landPos, ease(3.1));
      targetLook.current.lerp(landGround, ease(3.1));
    } else {
      const dist = THREE.MathUtils.lerp(MAX_DIST, MIN_DIST, zoom);
      const chasePos = tmp.goalPos
        .copy(satPos)
        .addScaledVector(up, 0.26 * dist)
        .addScaledVector(forward, -0.12 * dist);

      targetPos.current.lerp(chasePos, ease(5));
      const look = tmp.goalLook.copy(satPos).lerp(groundPos, 0.55);
      targetLook.current.lerp(look, ease(7.7));
    }

    camera.position.lerp(targetPos.current, ease(7.7));
    camera.lookAt(targetLook.current);
  });

  return null;
}
