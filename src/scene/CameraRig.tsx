import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import { GLOBE_RADIUS } from './Globe';
import { PLANE_ALTITUDE } from './Plane';

interface CameraRigProps {
  lat: number;
  lng: number;
  heading: number;
  zoom: number; // 0=far, 1=close
  isLanding: boolean;
  landTarget: { lat: number; lng: number } | null;
}

const MIN_DIST = 0.8;
const MAX_DIST = 9;
const CHASE_OFFSET_UP = 0.35;
const CHASE_OFFSET_BACK = 0.55;

export default function CameraRig({ lat, lng, heading, zoom, isLanding, landTarget }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const headingRad = heading * (Math.PI / 180);
    const planePos = latLngToVector3(lat, lng, GLOBE_RADIUS + PLANE_ALTITUDE);
    const up = planePos.clone().normalize();

    const north = new THREE.Vector3(0, 1, 0);
    const east = new THREE.Vector3().crossVectors(north, up).normalize();
    const trueNorth = new THREE.Vector3().crossVectors(up, east).normalize();

    const forward = new THREE.Vector3()
      .copy(trueNorth)
      .multiplyScalar(Math.cos(headingRad))
      .addScaledVector(east, Math.sin(headingRad))
      .normalize();

    if (isLanding && landTarget) {
      // Zoom into landing point
      const landPos = latLngToVector3(landTarget.lat, landTarget.lng, GLOBE_RADIUS + 0.4);
      targetPos.current.lerp(landPos, 0.04);
      targetLook.current.lerp(planePos, 0.04);
    } else {
      const dist = THREE.MathUtils.lerp(MAX_DIST, MIN_DIST, zoom);
      const back = forward.clone().negate();
      const chasePos = planePos
        .clone()
        .addScaledVector(back, CHASE_OFFSET_BACK * dist * 0.3)
        .addScaledVector(up, CHASE_OFFSET_UP * dist * 0.22);

      targetPos.current.lerp(chasePos, 0.07);
      targetLook.current.lerp(planePos, 0.1);
    }

    camera.position.lerp(targetPos.current, 0.12);
    camera.lookAt(targetLook.current);
  });

  return null;
}
