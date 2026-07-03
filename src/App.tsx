import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import Globe from './scene/Globe';
import Starfield from './scene/Starfield';
import Satellite from './scene/Satellite';
import Pins from './scene/Pins';
import NearbyProjector from './scene/NearbyProjector';
import CameraRig from './scene/CameraRig';
import Header from './ui/Header';
import Intro from './ui/Intro';
import ControlsHint from './ui/ControlsHint';
import NearbyLabels from './ui/NearbyLabels';
import Passport from './ui/Passport';
import locations from './data/locations';
import { angularDistance } from './lib/geo';
import type { Flight } from './lib/flight';
import './App.css';

// Code-split so Leaflet/react-leaflet stay out of the initial bundle; the chunk
// loads on the first landing.
const DetailPanel = lazy(() => import('./ui/DetailPanel'));

// Movement tuning (degrees per ~60fps frame).
const MAX_SPEED = 0.5;    // top traversal speed
const ACCEL = 0.03;       // how quickly velocity eases toward target (lower = slower ramp)
const FRICTION = 0.06;    // how quickly velocity decays when keys released
const AUTO_EASE = 0.05;   // fly-to easing toward a passport target
const PROXIMITY_DEG = 16;

const wrapLng = (lng: number) => ((lng + 180) % 360 + 360) % 360 - 180;

// Smoothly interpolate between two compass headings (degrees) the short way around.
function lerpHeading(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180;
  return a + diff * t;
}

function LoadingScreen() {
  return (
    <div className="loadingOverlay">
      <div className="loadingGlobe">🛰️</div>
      <div className="loadingText">Acquiring orbit...</div>
    </div>
  );
}

// Single source of truth for motion. Runs inside the R3F frame loop so the
// satellite and camera (which read the same ref) never tear against it.
function FlightController({
  flightRef,
  keysRef,
  autoTargetRef,
  landingRef,
  introRef,
  onSync,
}: {
  flightRef: React.MutableRefObject<Flight>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  autoTargetRef: React.MutableRefObject<{ lat: number; lng: number } | null>;
  landingRef: React.MutableRefObject<boolean>;
  introRef: React.MutableRefObject<boolean>;
  onSync: (f: Flight) => void;
}) {
  const syncAccum = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta * 60, 3); // normalize to frame-units, clamp big hitches
    const f = flightRef.current;

    // Intro: the satellite drifts along a slow orbit (camera handles the cinematic
    // sweep). No input, no proximity sync — purely a backdrop for the landing copy.
    if (introRef.current) {
      f.vLat = 0;
      f.vLng = 0;
      f.lng = wrapLng(f.lng + 0.16 * dt);
      f.lat += (14 - f.lat) * Math.min(1, 0.02 * dt);
      f.heading = 90;
      return;
    }

    if (autoTargetRef.current) {
      // Passport fly-to: ease toward the target, ignore input.
      const target = autoTargetRef.current;
      f.vLat = 0;
      f.vLng = 0;
      const k = Math.min(1, AUTO_EASE * dt);
      const dLng = ((target.lng - f.lng + 540) % 360) - 180;
      f.lat += (target.lat - f.lat) * k;
      f.lng = wrapLng(f.lng + dLng * k);
      f.heading = lerpHeading(
        f.heading,
        Math.atan2(dLng, target.lat - f.lat) * (180 / Math.PI),
        Math.min(1, 0.1 * dt),
      );
    } else if (!landingRef.current) {
      const keys = keysRef.current;
      let ix = 0; // east +
      let iy = 0; // north +
      if (keys['w'] || keys['arrowup']) iy += 1;
      if (keys['s'] || keys['arrowdown']) iy -= 1;
      if (keys['d'] || keys['arrowright']) ix += 1;
      if (keys['a'] || keys['arrowleft']) ix -= 1;

      const hasInput = ix !== 0 || iy !== 0;
      if (hasInput) {
        const m = Math.hypot(ix, iy);
        ix /= m;
        iy /= m;
      }

      // Ease velocity toward the desired velocity: ramps up while held, coasts down when released.
      const desiredVLat = iy * MAX_SPEED;
      const desiredVLng = ix * MAX_SPEED;
      const rate = Math.min(1, (hasInput ? ACCEL : FRICTION) * dt);
      f.vLat += (desiredVLat - f.vLat) * rate;
      f.vLng += (desiredVLng - f.vLng) * rate;

      f.lat = Math.max(-85, Math.min(85, f.lat + f.vLat * dt));
      f.lng = wrapLng(f.lng + f.vLng * dt);

      const speed = Math.hypot(f.vLat, f.vLng);
      if (speed > 0.02) {
        f.heading = lerpHeading(
          f.heading,
          Math.atan2(f.vLng, f.vLat) * (180 / Math.PI),
          Math.min(1, 0.1 * dt),
        );
      }
    } else {
      f.vLat = 0;
      f.vLng = 0;
    }

    // Push to React state ~10x/sec for UI (pins / visited) without re-rendering every frame.
    syncAccum.current += delta;
    if (syncAccum.current >= 0.1) {
      syncAccum.current = 0;
      onSync(f);
    }
  });

  return null;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [zoom, setZoom] = useState(0.35);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [activeLandingId, setActiveLandingId] = useState<string | null>(null);
  const [isLanding, setIsLanding] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  const flightRef = useRef<Flight>({ lat: 20, lng: 0, heading: 0, vLat: 0, vLng: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const autoTargetRef = useRef<{ lat: number; lng: number } | null>(null);
  const landingRef = useRef(isLanding);
  const activeLandingRef = useRef<string | null>(activeLandingId);
  const introRef = useRef(showIntro);
  landingRef.current = isLanding;
  activeLandingRef.current = activeLandingId;
  introRef.current = showIntro;

  // Sync flight ref → React state (called ~10x/sec from the controller).
  // Marker proximity for the nearby-labels overlay is handled in NearbyProjector;
  // here we only flag locations the satellite has passed as visited.
  function handleSync(f: Flight) {
    locations.forEach((loc) => {
      const distRad = angularDistance(f.lat, f.lng, loc.coordinates.lat, loc.coordinates.lng);
      if (distRad * (180 / Math.PI) < PROXIMITY_DEG) {
        setVisitedIds((prev) => {
          if (prev.has(loc.id)) return prev;
          const next = new Set(prev);
          next.add(loc.id);
          return next;
        });
      }
    });
  }

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'l' && !landingRef.current) {
        landAtNearest();
      }
      if (e.key === 'Escape' && activeLandingRef.current) {
        takeOff();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Track viewport so the 2D label overlay matches the canvas pixel space.
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Scroll zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0, Math.min(1, z + e.deltaY * 0.001)));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  // Touch controls — drag moves the satellite directly, pinch zooms.
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchRef.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          dist: Math.sqrt(dx * dx + dy * dy),
        };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current) return;
      if (e.touches.length === 2 && touchRef.current.dist != null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        setZoom((z) => Math.max(0, Math.min(1, z + (touchRef.current!.dist! - newDist) * 0.003)));
        touchRef.current.dist = newDist;
      } else if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchRef.current.x;
        const dy = e.touches[0].clientY - touchRef.current.y;
        touchRef.current.x = e.touches[0].clientX;
        touchRef.current.y = e.touches[0].clientY;
        const f = flightRef.current;
        f.vLat = 0;
        f.vLng = 0;
        f.lat = Math.max(-85, Math.min(85, f.lat - dy * 0.25));
        f.lng = wrapLng(f.lng + dx * 0.25);
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
          f.heading = lerpHeading(f.heading, Math.atan2(dx, -dy) * (180 / Math.PI), 0.2);
        }
      }
    };
    const onTouchEnd = () => { touchRef.current = null; };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  function getNearestInRange(): string | null {
    const f = flightRef.current;
    let best: string | null = null;
    let bestDist = Infinity;
    locations.forEach((loc) => {
      const dist = angularDistance(f.lat, f.lng, loc.coordinates.lat, loc.coordinates.lng);
      if (dist * (180 / Math.PI) < PROXIMITY_DEG && dist < bestDist) {
        bestDist = dist;
        best = loc.id;
      }
    });
    return best;
  }

  function landAtNearest() {
    const id = getNearestInRange();
    if (id) triggerLand(id);
  }

  // Clicked a pin popup: ease to center it, then land.
  function landAt(id: string) {
    const loc = locations.find((l) => l.id === id);
    if (loc) autoTargetRef.current = { ...loc.coordinates };
    setTimeout(() => {
      autoTargetRef.current = null;
      triggerLand(id);
    }, 500);
  }

  function triggerLand(id: string) {
    setIsLanding(true);
    setTimeout(() => {
      setActiveLandingId(id);
      setVisitedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }, 800);
  }

  function takeOff() {
    setActiveLandingId(null);
    setTimeout(() => setIsLanding(false), 400);
  }

  // Passport: fly across to the location, then auto-land.
  function flyTo(id: string) {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return;
    autoTargetRef.current = { ...loc.coordinates };
    setTimeout(() => {
      autoTargetRef.current = null;
      triggerLand(id);
    }, 1500);
  }

  const activeLoc = activeLandingId
    ? (locations.find((l) => l.id === activeLandingId) ?? null)
    : null;
  const landingCoords = activeLoc ? activeLoc.coordinates : null;

  return (
    <div className="app">
      {showIntro && <Intro onDismiss={() => setShowIntro(false)} />}

      {!loaded && <LoadingScreen />}

      <Canvas
        camera={{ position: [0, 0, 7], fov: 50, near: 0.01, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#030611' }}
        onCreated={() => { setTimeout(() => setLoaded(true), 1800); }}
      >
        {/* Flat, even lighting so the stylized globe stays readable from every angle
            (no harsh day/night terminator) while directionals still define facets. */}
        <ambientLight intensity={0.85} />
        <hemisphereLight args={['#cfeaff', '#2a3344', 0.6]} />
        <directionalLight position={[5, 3, 5]} intensity={0.6} />
        <directionalLight position={[-5, -2, -4]} intensity={0.5} color="#cfe0ff" />

        <FlightController
          flightRef={flightRef}
          keysRef={keysRef}
          autoTargetRef={autoTargetRef}
          landingRef={landingRef}
          introRef={introRef}
          onSync={handleSync}
        />

        <Suspense fallback={null}>
          <Globe autoRotate={false} />
          <Satellite flightRef={flightRef} visible={!activeLandingId} scale={showIntro ? 2.1 : 1} />
          <Pins locations={locations} visitedIds={visitedIds} />
          <NearbyProjector
            locations={locations}
            flightRef={flightRef}
            active={!showIntro && !activeLandingId}
          />
          <CameraRig
            flightRef={flightRef}
            zoom={zoom}
            isLanding={isLanding}
            intro={showIntro}
            landTarget={landingCoords}
          />
        </Suspense>

        <Starfield />
      </Canvas>

      {!showIntro && <Header onPassport={() => setPassportOpen(true)} />}
      {!showIntro && !activeLandingId && <ControlsHint />}

      {!showIntro && !activeLandingId && (
        <NearbyLabels viewport={viewport} onLand={landAt} />
      )}

      <Suspense fallback={null}>
        {activeLoc && <DetailPanel location={activeLoc} onClose={takeOff} />}
      </Suspense>

      <Passport
        open={passportOpen}
        visitedIds={visitedIds}
        onClose={() => setPassportOpen(false)}
        onFlyTo={flyTo}
      />
    </div>
  );
}
