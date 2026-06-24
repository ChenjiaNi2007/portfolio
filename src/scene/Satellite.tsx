import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import { GLOBE_RADIUS } from './Globe';

interface SatelliteProps {
  lat: number;
  lng: number;
  heading: number; // degrees, 0 = north, derived from travel direction
  visible?: boolean;
}

export const SATELLITE_ALTITUDE = 0.5;

export default function Satellite({ lat, lng, heading, visible = true }: SatelliteProps) {
  const outerRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const blinkRef = useRef<THREE.MeshStandardMaterial>(null);

  const position = useMemo(
    () => latLngToVector3(lat, lng, GLOBE_RADIUS + SATELLITE_ALTITUDE),
    [lat, lng],
  );

  useFrame(({ clock }) => {
    if (!outerRef.current) return;

    // Sit on the radial axis, with local +Y pointing away from the planet.
    outerRef.current.position.copy(position);
    const up = position.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    // Yaw around the up axis to face the travel direction.
    const yaw = new THREE.Quaternion().setFromAxisAngle(up, -heading * (Math.PI / 180));
    outerRef.current.quaternion.copy(yaw.multiply(q));

    const t = clock.getElapsedTime();
    if (bodyRef.current) bodyRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    if (dishRef.current) dishRef.current.rotation.z = t * 0.6;

    // Scanning beam shimmer + ground ring pulse.
    if (beamRef.current) {
      const m = beamRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.12 + Math.abs(Math.sin(t * 2)) * 0.12;
    }
    if (ringRef.current) {
      const p = (t % 1.6) / 1.6;
      ringRef.current.scale.setScalar(0.3 + p * 1.4);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - p);
    }
    if (blinkRef.current) {
      blinkRef.current.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 3)) * 1.2;
    }
  });

  if (!visible) return null;

  return (
    <group ref={outerRef}>
      {/* Satellite body — small scale, +Y points to space, -Y faces Earth */}
      <group ref={bodyRef} scale={0.07}>
        {/* Main bus */}
        <mesh>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshStandardMaterial color="#d9b75a" roughness={0.5} metalness={0.6} flatShading />
        </mesh>
        {/* Gold foil cap */}
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.42, 0.1, 0.42]} />
          <meshStandardMaterial color="#caa23f" roughness={0.4} metalness={0.7} flatShading />
        </mesh>

        {/* Solar panel arms */}
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[-0.55, 0, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Solar panels */}
        <mesh position={[1.1, 0, 0]}>
          <boxGeometry args={[0.9, 0.03, 0.55]} />
          <meshStandardMaterial color="#1b3a6b" emissive="#13294d" emissiveIntensity={0.4} metalness={0.3} roughness={0.5} flatShading />
        </mesh>
        <mesh position={[-1.1, 0, 0]}>
          <boxGeometry args={[0.9, 0.03, 0.55]} />
          <meshStandardMaterial color="#1b3a6b" emissive="#13294d" emissiveIntensity={0.4} metalness={0.3} roughness={0.5} flatShading />
        </mesh>

        {/* Scanner dish on the Earth-facing side */}
        <mesh ref={dishRef} position={[0, -0.36, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.18, 12, 1, true]} />
          <meshStandardMaterial color="#e8eef5" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} flatShading />
        </mesh>
        {/* Dish emitter */}
        <mesh position={[0, -0.46, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#6fffd6" emissive="#6fffd6" emissiveIntensity={1.4} />
        </mesh>

        {/* Blinking status light */}
        <mesh position={[0, 0.42, 0.18]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial ref={blinkRef} color="#ff5a4d" emissive="#ff5a4d" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Scanning beam: narrow at the satellite, wide at the surface (points down -Y) */}
      <mesh ref={beamRef} position={[0, -SATELLITE_ALTITUDE / 2, 0]}>
        <coneGeometry args={[0.16, SATELLITE_ALTITUDE * 0.96, 24, 1, true]} />
        <meshBasicMaterial
          color="#6fffd6"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Expanding scan ring on the ground directly below */}
      <mesh ref={ringRef} position={[0, -SATELLITE_ALTITUDE + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.075, 32]} />
        <meshBasicMaterial color="#6fffd6" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
