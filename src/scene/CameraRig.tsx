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
  landTarget: { lat: number; lng: number } | null;
}

const MIN_DIST = 1.4;
const MAX_DIST = 9;

export default function CameraRig({ flightRef, zoom, isLanding, landTarget }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const f = flightRef.current;
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
      targetPos.current.lerp(landPos, 0.05);
      targetLook.current.lerp(landGround, 0.05);
    } else {
      const dist = THREE.MathUtils.lerp(MAX_DIST, MIN_DIST, zoom);
      const back = forward.clone().negate();
      const chasePos = satPos
        .clone()
        .addScaledVector(up, 0.26 * dist)
        .addScaledVector(back, 0.12 * dist);

      targetPos.current.lerp(chasePos, 0.08);
      const look = satPos.clone().lerp(groundPos, 0.55);
      targetLook.current.lerp(look, 0.12);
    }

    camera.position.lerp(targetPos.current, 0.12);
    camera.lookAt(targetLook.current);
  });

  return null;
}
