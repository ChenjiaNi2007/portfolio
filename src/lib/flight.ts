// Shared mutable flight state, driven by a single useFrame loop and read by the
// satellite + camera so their motion stays perfectly in sync (no frame tearing).
export interface Flight {
  lat: number;
  lng: number;
  heading: number; // degrees, 0 = north, derived from travel direction
  vLat: number; // angular velocity (deg per frame-unit)
  vLng: number;
}
