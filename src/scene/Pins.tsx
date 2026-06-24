import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToVector3 } from '../lib/geo';
import type { MapLocation } from '../data/locations';
import { GLOBE_RADIUS } from './Globe';
import styles from './Pins.module.css';

const PIN_ALTITUDE = 0.04;
const POPUP_PROXIMITY = 0.28; // radians (~16 deg)

interface PinsProps {
  locations: MapLocation[];
  planeLat: number;
  planeLng: number;
  visitedIds: Set<string>;
  onLand: (id: string) => void;
  panelOpen: boolean;
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
  near,
  visited,
  onLand,
}: {
  location: Extract<MapLocation, { type: 'project' }>;
  near: boolean;
  visited: boolean;
  onLand: () => void;
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

      {near && (
        <Html
          position={[0, 0.14, 0]}
          center
          distanceFactor={2.5}
          zIndexRange={[100, 0]}
          occlude={false}
        >
          <div className={styles.popup + ' ' + styles.projectPopup}>
            <div className={styles.popupTitle}>{location.title}</div>
            <div className={styles.popupCity}>{location.city}</div>
            <div className={styles.popupSummary}>{location.summary}</div>
            <button className={styles.landBtn} onClick={onLand}>
              🛰 Scan location
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

function PhotoPin({
  location,
  near,
  visited,
  onLand,
}: {
  location: Extract<MapLocation, { type: 'photo' }>;
  near: boolean;
  visited: boolean;
  onLand: () => void;
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

      {near && (
        <Html
          position={[0, 0.14, 0]}
          center
          distanceFactor={2.5}
          zIndexRange={[100, 0]}
          occlude={false}
        >
          <div className={styles.popup + ' ' + styles.photoPopup}>
            <div className={styles.popupTitle}>{location.title}</div>
            <div className={styles.popupCity}>{location.city}</div>
            {location.photos[0] && (
              <img src={location.photos[0].src} alt={location.photos[0].alt} className={styles.popupThumb} />
            )}
            {!location.photos[0] && <div className={styles.popupPhotoIcon}>📷</div>}
            <div className={styles.popupSummary}>{location.caption}</div>
            <button className={styles.landBtn + ' ' + styles.photoLandBtn} onClick={onLand}>
              📷 Capture
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Pins({ locations, planeLat, planeLng, visitedIds, onLand, panelOpen }: PinsProps) {
  const toRad = (d: number) => d * (Math.PI / 180);

  function isNear(loc: MapLocation) {
    const { lat, lng } = loc.coordinates;
    const dLat = toRad(lat - planeLat);
    const dLng = toRad(lng - planeLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(planeLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) < POPUP_PROXIMITY;
  }

  return (
    <group>
      {locations.map((loc) =>
        loc.type === 'project' ? (
          <ProjectPin
            key={loc.id}
            location={loc}
            near={!panelOpen && isNear(loc)}
            visited={visitedIds.has(loc.id)}
            onLand={() => onLand(loc.id)}
          />
        ) : (
          <PhotoPin
            key={loc.id}
            location={loc}
            near={!panelOpen && isNear(loc)}
            visited={visitedIds.has(loc.id)}
            onLand={() => onLand(loc.id)}
          />
        ),
      )}
    </group>
  );
}
