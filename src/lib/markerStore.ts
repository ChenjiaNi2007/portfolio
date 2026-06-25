import { useSyncExternalStore } from 'react';

export interface ProjectedMarker {
  id: string;
  type: 'project' | 'photo';
  title: string;
  city: string;
  summary: string;
  x: number; // screen px
  y: number; // screen px
}

// Tiny external store for the nearby-marker overlay. The in-Canvas projector writes
// here every frame; only components that subscribe via useMarkers() re-render — the
// Three.js scene/App tree never re-renders from marker updates, so flight stays smooth.
let current: ProjectedMarker[] = [];
const listeners = new Set<() => void>();

export function setMarkers(next: ProjectedMarker[]) {
  current = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return current;
}

export function useMarkers() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
