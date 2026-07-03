import { useRef } from 'react';
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
      targetPos.current.lerp(
        new THREE.Vector3(Math.sin(az) * dist, 3.0 + Math.sin(t * 0.16) * 0.35, Math.cos(az) * dist),
        ease(2.5),
      );
      targetLook.current.lerp(new THREE.Vector3(0, 0, 0), ease(3.7));
      camera.position.lerp(targetPos.current, ease(3.7));
      camera.lookAt(targetLook.current);
      return;
    }
    const headingRad = f.heading * (Math.PI / 180);
    const satPos = latLngToVector3(f.lat, f.lng, GLOBE_RADIUS + SATELLITE_ALTITUDE);
    const groundPos = latLngToVector3(f.lat, f.lng, GLOBE_RADIUS);
    const up = satPos.clone().normalize();

    const north = new THREE.Vector3(0, 1, 0);
    const east = new THREE.Vector3().crossVectors(north, up).normalize();
    const trueNorth = new THREE.Vector3().crossVectors(up, east).normalize();

    const forward = new THREE.Vector3()
      .copy(trueNorth)
      .multiplyScalar(Math.cos(headingRad))
      .addScaledVector(east, Math.sin(headingRad))
      .normalize();

    if (isLanding && landTarget) {
      const landPos = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS + 0.45);
      const landGround = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS);
      targetPos.current.lerp(landPos, ease(3.1));
      targetLook.current.lerp(landGround, ease(3.1));
    } else {
      const dist = THREE.MathUtils.lerp(MAX_DIST, MIN_DIST, zoom);
      const back = forward.clone().negate();
      const chasePos = satPos
        .clone()
        .addScaledVector(up, 0.26 * dist)
        .addScaledVector(back, 0.12 * dist);

      targetPos.current.lerp(chasePos, ease(5));
      const look = satPos.clone().lerp(groundPos, 0.55);
      targetLook.current.lerp(look, ease(7.7));
    }

    camera.position.lerp(targetPos.current, ease(7.7));
    camera.lookAt(targetLook.current);
  });

  return null;
}
