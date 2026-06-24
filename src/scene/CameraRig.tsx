import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import { GLOBE_RADIUS } from './Globe';
import { SATELLITE_ALTITUDE } from './Satellite';

interface CameraRigProps {
  lat: number;
  lng: number;
  heading: number;
  zoom: number; // 0 = far, 1 = close
  isLanding: boolean;
  landTarget: { lat: number; lng: number } | null;
}

const MIN_DIST = 1.4;
const MAX_DIST = 9;

export default function CameraRig({ lat, lng, heading, zoom, isLanding, landTarget }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const headingRad = heading * (Math.PI / 180);
    const satPos = latLngToVector3(lat, lng, GLOBE_RADIUS + SATELLITE_ALTITUDE);
    const groundPos = latLngToVector3(lat, lng, GLOBE_RADIUS);
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
      // Drop toward the scanned location.
      const landPos = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS + 0.45);
      const landGround = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS);
      targetPos.current.lerp(landPos, 0.05);
      targetLook.current.lerp(landGround, 0.05);
    } else {
      const dist = THREE.MathUtils.lerp(MAX_DIST, MIN_DIST, zoom);
      const back = forward.clone().negate();
      // High-angle chase: above and behind the satellite, framing the ground it scans.
      const chasePos = satPos
        .clone()
        .addScaledVector(up, 0.22 * dist)
        .addScaledVector(back, 0.14 * dist);

      targetPos.current.lerp(chasePos, 0.07);
      // Look at a point between the satellite and the ground beneath it.
      const look = satPos.clone().lerp(groundPos, 0.55);
      targetLook.current.lerp(look, 0.1);
    }

    camera.position.lerp(targetPos.current, 0.1);
    camera.lookAt(targetLook.current);
  });

  return null;
}
