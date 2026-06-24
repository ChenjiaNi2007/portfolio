import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Globe from './scene/Globe';
import Starfield from './scene/Starfield';
import Plane from './scene/Plane';
import Pins from './scene/Pins';
import CameraRig from './scene/CameraRig';
import Header from './ui/Header';
import Intro from './ui/Intro';
import ControlsHint from './ui/ControlsHint';
import DetailPanel from './ui/DetailPanel';
import Passport from './ui/Passport';
import locations from './data/locations';
import { angularDistance } from './lib/geo';
import './App.css';

const SPEED = 0.35;
const BANK_DECAY = 0.08;
const BANK_AMOUNT = 0.6;
const PROXIMITY_DEG = 16;

function LoadingScreen() {
  return (
    <div className="loadingOverlay">
      <div className="loadingGlobe">🌍</div>
      <div className="loadingText">Loading Earth...</div>
    </div>
  );
}


export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [lat, setLat] = useState(20);
  const [lng, setLng] = useState(0);
  const [heading, setHeading] = useState(0);
  const [bankAngle, setBankAngle] = useState(0);
  const [zoom, setZoom] = useState(0.35);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [activeLandingId, setActiveLandingId] = useState<string | null>(null);
  const [isLanding, setIsLanding] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const headingRef = useRef(heading);
  const bankRef = useRef(bankAngle);
  const landingRef = useRef(isLanding);

  latRef.current = lat;
  lngRef.current = lng;
  headingRef.current = heading;
  bankRef.current = bankAngle;
  landingRef.current = isLanding;

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'l' && !landingRef.current) {
        landAtNearest();
      }
      if (e.key === 'Escape' && activeLandingId) {
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
  });

  // Scroll zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0, Math.min(1, z + e.deltaY * 0.001)));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  // Touch controls
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
        const delta = (touchRef.current.dist - newDist) * 0.003;
        setZoom((z) => Math.max(0, Math.min(1, z + delta)));
        touchRef.current.dist = newDist;
      } else if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchRef.current.x;
        const dy = e.touches[0].clientY - touchRef.current.y;
        touchRef.current.x = e.touches[0].clientX;
        touchRef.current.y = e.touches[0].clientY;
        setHeading((h) => h + dx * 0.5);
        setLat((l) => Math.max(-85, Math.min(85, l - dy * 0.3)));
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

  // Game loop
  useEffect(() => {
    let frameId: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      if (!landingRef.current) {
        const keys = keysRef.current;
        const forward  = keys['arrowup']    || keys['w'];
        const backward = keys['arrowdown']  || keys['s'];
        const left     = keys['arrowleft']  || keys['a'];
        const right    = keys['arrowright'] || keys['d'];

        let newHeading = headingRef.current;
        let newBank    = bankRef.current;

        if (left)  { newHeading -= 1.8 * dt; newBank  =  BANK_AMOUNT; }
        if (right) { newHeading += 1.8 * dt; newBank  = -BANK_AMOUNT; }
        if (!left && !right) { newBank += (0 - newBank) * BANK_DECAY * dt; }

        const headRad = newHeading * (Math.PI / 180);
        const spd = SPEED * dt;
        let newLat = latRef.current;
        let newLng = lngRef.current;

        if (forward)  { newLat += Math.cos(headRad) * spd; newLng += Math.sin(headRad) * spd; }
        if (backward) { newLat -= Math.cos(headRad) * spd; newLng -= Math.sin(headRad) * spd; }

        newLat = Math.max(-85, Math.min(85, newLat));
        newLng = ((newLng + 180) % 360 + 360) % 360 - 180;

        setLat(newLat);
        setLng(newLng);
        setHeading(newHeading);
        setBankAngle(newBank);

        // Mark nearby locations as visited
        locations.forEach((loc) => {
          const distRad = angularDistance(newLat, newLng, loc.coordinates.lat, loc.coordinates.lng);
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

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  function getNearestInRange(): string | null {
    let best: string | null = null;
    let bestDist = Infinity;
    locations.forEach((loc) => {
      const dist = angularDistance(lat, lng, loc.coordinates.lat, loc.coordinates.lng);
      const distDeg = dist * (180 / Math.PI);
      if (distDeg < PROXIMITY_DEG && dist < bestDist) {
        bestDist = dist;
        best = loc.id;
      }
    });
    return best;
  }

  function landAtNearest() {
    const id = getNearestInRange();
    if (!id) return;
    triggerLand(id);
  }

  function landAt(id: string) {
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setLat(loc.coordinates.lat);
      setLng(loc.coordinates.lng);
    }
    triggerLand(id);
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

  function flyTo(id: string) {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return;
    setLat(loc.coordinates.lat);
    setLng(loc.coordinates.lng);
    setTimeout(() => landAt(id), 1400);
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
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <directionalLight position={[-5, -3, -5]} intensity={0.15} color="#aaccff" />

        <Suspense fallback={null}>
          <Globe autoRotate={false} />
          <Plane
            lat={lat}
            lng={lng}
            heading={heading}
            bankAngle={bankAngle}
            visible={!activeLandingId}
          />
          <Pins
            locations={locations}
            planeLat={lat}
            planeLng={lng}
            visitedIds={visitedIds}
            onLand={landAt}
            panelOpen={!!activeLandingId}
          />
          <CameraRig
            lat={lat}
            lng={lng}
            heading={heading}
            zoom={zoom}
            isLanding={isLanding}
            landTarget={landingCoords}
          />
        </Suspense>

        <Starfield />
      </Canvas>

      <Header onPassport={() => setPassportOpen(true)} />
      {!showIntro && !activeLandingId && <ControlsHint />}

      <DetailPanel location={activeLoc} onClose={takeOff} />

      <Passport
        open={passportOpen}
        visitedIds={visitedIds}
        onClose={() => setPassportOpen(false)}
        onFlyTo={flyTo}
      />
    </div>
  );
}
