import * as THREE from 'three';

// Pass `out` from per-frame code to avoid allocating a new vector every call.
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return out.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function vector3ToLatLng(v: THREE.Vector3): { lat: number; lng: number } {
  const radius = v.length();
  const lat = 90 - Math.acos(v.y / radius) * (180 / Math.PI);
  const lng = (Math.atan2(v.z, -v.x) * (180 / Math.PI)) - 180;
  return { lat, lng: lng < -180 ? lng + 360 : lng };
}

export function angularDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => d * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}
