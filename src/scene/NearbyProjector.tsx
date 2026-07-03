import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3, angularDistance } from '../lib/geo';
import { GLOBE_RADIUS } from './Globe';
import { setMarkers } from '../lib/markerStore';
import type { ProjectedMarker } from '../lib/markerStore';
import type { MapLocation } from '../data/locations';
import type { Flight } from '../lib/flight';

// Anchor the leader line near the top of the beacon/camera marker.
const ANCHOR_ALTITUDE = 0.14;
const PROXIMITY_DEG = 16;

interface NearbyProjectorProps {
  locations: MapLocation[];
  flightRef: React.MutableRefObject<Flight>;
  active: boolean; // false when a panel is open / intro showing → emit nothing
}

// Runs inside the R3F frame loop: for every marker the satellite is near AND that
// sits on the camera-facing hemisphere, project its world position to screen pixels
// and push the result into the external marker store (never React/App state).
export default function NearbyProjector({ locations, flightRef, active }: NearbyProjectorProps) {
  const { camera, size } = useThree();
  const lastKey = useRef('');
  const camDir = useRef(new THREE.Vector3());
  const pinVec = useRef(new THREE.Vector3());
  const ndc = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!active) {
      if (lastKey.current !== 'off') {
        lastKey.current = 'off';
        setMarkers([]);
      }
      return;
    }

    const f = flightRef.current;
    const camDist = camera.position.length();
    const cosHorizon = GLOBE_RADIUS / camDist; // beyond this angle the globe occludes the pin
    camDir.current.copy(camera.position).normalize();

    const out: ProjectedMarker[] = [];
    for (const loc of locations) {
      const { lat, lng } = loc.coordinates;
      if (angularDistance(f.lat, f.lng, lat, lng) * (180 / Math.PI) > PROXIMITY_DEG) continue;

      pinVec.current.copy(latLngToVector3(lat, lng, GLOBE_RADIUS + ANCHOR_ALTITUDE));
      // Hide markers on the far side of the globe.
      if (pinVec.current.dot(camDir.current) / pinVec.current.length() < cosHorizon) continue;

      ndc.current.copy(pinVec.current).project(camera);
      if (ndc.current.z > 1) continue; // behind the camera
      const x = (ndc.current.x * 0.5 + 0.5) * size.width;
      const y = (-ndc.current.y * 0.5 + 0.5) * size.height;
      if (x < 0 || x > size.width || y < 0 || y > size.height) continue;

      out.push({
        id: loc.id,
        type: loc.type,
        title: loc.title,
        city: loc.city,
        summary: loc.type === 'project' ? loc.summary : loc.caption,
        x,
        y,
      });
    }

    // Tenth-of-a-pixel precision: skips redundant renders when nothing moved,
    // without quantizing slow pin motion into visible 1px steps.
    const key = out.map((m) => `${m.id}:${Math.round(m.x * 10)}:${Math.round(m.y * 10)}`).join('|');
    if (key !== lastKey.current) {
      lastKey.current = key;
      setMarkers(out);
    }
  });

  return null;
}
