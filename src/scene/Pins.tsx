import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import type { MapLocation } from '../data/locations';
import { GLOBE_RADIUS } from './Globe';

const PIN_ALTITUDE = 0.04;

interface PinsProps {
  locations: MapLocation[];
  visitedIds: Set<string>;
}

function PulseRing({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.getElapsedTime() % 1.5) / 1.5;
    meshRef.current.scale.setScalar(1 + t * 1.2);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t);
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.012, 0.022, 24]} />
      <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function ProjectPin({
  location,
  visited,
}: {
  location: Extract<MapLocation, { type: 'project' }>;
  visited: boolean;
}) {
  const pos = useMemo(
    () => latLngToVector3(location.coordinates.lat, location.coordinates.lng, GLOBE_RADIUS + PIN_ALTITUDE),
    [location.coordinates],
  );
  const up = pos.clone().normalize();

  return (
    <group position={pos}>
      {/* Orient beacon upward from sphere */}
      <group quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)}>
        {/* Beacon stick */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
          <meshStandardMaterial color={visited ? '#ffd700' : '#ff6b35'} emissive={visited ? '#ffd700' : '#ff6b35'} emissiveIntensity={0.3} />
        </mesh>
        {/* Flag */}
        <mesh position={[0.018, 0.078, 0]}>
          <boxGeometry args={[0.03, 0.02, 0.002]} />
          <meshStandardMaterial color={visited ? '#ffd700' : '#ff6b35'} />
        </mesh>
        <PulseRing color="#ff6b35" />
      </group>
    </group>
  );
}

function PhotoPin({
  location,
  visited,
}: {
  location: Extract<MapLocation, { type: 'photo' }>;
  visited: boolean;
}) {
  const pos = useMemo(
    () => latLngToVector3(location.coordinates.lat, location.coordinates.lng, GLOBE_RADIUS + PIN_ALTITUDE),
    [location.coordinates],
  );
  const up = pos.clone().normalize();

  return (
    <group position={pos}>
      <group quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)}>
        {/* Camera body */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.032, 0.024, 0.016]} />
          <meshStandardMaterial color={visited ? '#aad4ff' : '#4fc3f7'} emissive={visited ? '#aad4ff' : '#4fc3f7'} emissiveIntensity={0.4} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0.03, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.008, 12]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <PulseRing color="#4fc3f7" />
      </group>
    </group>
  );
}

export default function Pins({ locations, visitedIds }: PinsProps) {
  return (
    <group>
      {locations.map((loc) =>
        loc.type === 'project' ? (
          <ProjectPin key={loc.id} location={loc} visited={visitedIds.has(loc.id)} />
        ) : (
          <PhotoPin key={loc.id} location={loc} visited={visitedIds.has(loc.id)} />
        ),
      )}
    </group>
  );
}
