import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import { GLOBE_RADIUS } from './Globe';

interface PlaneProps {
  lat: number;
  lng: number;
  heading: number; // degrees, 0=north
  bankAngle: number; // radians, positive = bank right
  altitude?: number;
  visible?: boolean;
}

export const PLANE_ALTITUDE = 0.09;

export default function Plane({
  lat,
  lng,
  heading,
  bankAngle,
  altitude = PLANE_ALTITUDE,
  visible = true,
}: PlaneProps) {
  const groupRef = useRef<THREE.Group>(null);

  const position = useMemo(
    () => latLngToVector3(lat, lng, GLOBE_RADIUS + altitude),
    [lat, lng, altitude],
  );

  useFrame(() => {
    if (!groupRef.current) return;

    // Place group at position on sphere surface
    groupRef.current.position.copy(position);

    // Orient "up" to point away from globe center
    const up = position.clone().normalize();

    // Heading: convert to a tangent direction
    const headingRad = heading * (Math.PI / 180);
    const north = new THREE.Vector3(0, 1, 0);
    const east = new THREE.Vector3().crossVectors(north, up).normalize();
    const trueNorth = new THREE.Vector3().crossVectors(up, east).normalize();

    const forward = new THREE.Vector3()
      .copy(trueNorth)
      .multiplyScalar(Math.cos(headingRad))
      .addScaledVector(east, Math.sin(headingRad))
      .normalize();

    const lookTarget = new THREE.Vector3().copy(position).add(forward);
    groupRef.current.lookAt(lookTarget);

    // Apply bank around local forward axis
    const bankQ = new THREE.Quaternion().setFromAxisAngle(forward, bankAngle * 0.4);
    groupRef.current.quaternion.multiply(bankQ);
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} scale={0.025}>
      {/* Fuselage */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 2.5, 8]} />
        <meshStandardMaterial color="#e8f4fd" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 1.55, 0]}>
        <coneGeometry args={[0.18, 0.6, 8]} />
        <meshStandardMaterial color="#e8f4fd" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Main wings */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.08, 0.55]} />
        <meshStandardMaterial color="#c8dff5" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Wing tips (dihedral hint) */}
      <mesh position={[1.7, 0.18, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.7, 0.06, 0.4]} />
        <meshStandardMaterial color="#c8dff5" roughness={0.4} />
      </mesh>
      <mesh position={[-1.7, 0.18, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.7, 0.06, 0.4]} />
        <meshStandardMaterial color="#c8dff5" roughness={0.4} />
      </mesh>

      {/* Horizontal stabilizer */}
      <mesh position={[0, -1.0, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.35]} />
        <meshStandardMaterial color="#c8dff5" roughness={0.4} />
      </mesh>

      {/* Vertical tail */}
      <mesh position={[0, -0.8, -0.2]}>
        <boxGeometry args={[0.06, 0.8, 0.5]} />
        <meshStandardMaterial color="#ff6b35" roughness={0.4} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.7, 0.16]}>
        <boxGeometry args={[0.3, 0.35, 0.25]} />
        <meshStandardMaterial color="#7ec8e3" roughness={0.1} metalness={0.6} transparent opacity={0.7} />
      </mesh>

      {/* Engine nacelle */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.35, 8]} />
        <meshStandardMaterial color="#999" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Propeller */}
      <mesh position={[0, 1.43, 0]}>
        <boxGeometry args={[1.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#555" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}
