import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

export const GLOBE_RADIUS = 2;

// Read an image's pixels into an ImageData buffer (same-origin → not tainted).
function toImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

// Sample an equirectangular image at a lat/lng (matches latLngToVector3's framing).
function sampleRGB(data: ImageData, lng: number, lat: number): [number, number, number] {
  const u = (lng + 180) / 360;
  const v = (90 - lat) / 180;
  const x = Math.min(data.width - 1, Math.max(0, Math.round(u * (data.width - 1))));
  const y = Math.min(data.height - 1, Math.max(0, Math.round(v * (data.height - 1))));
  const idx = (y * data.width + x) * 4;
  return [data.data[idx] / 255, data.data[idx + 1] / 255, data.data[idx + 2] / 255];
}

// Build a true low-poly globe: every triangle gets ONE flat colour sampled from the
// map at its centroid (ocean vs land from the specular mask, land hue from the day
// map, posterized). No texture mapping on the mesh, so there are no UV seams, no pole
// distortion, and the result reads as a faceted stylized planet.
function makeLowPolyEarth(
  radius: number,
  detail: number,
  day: ImageData,
  spec: ImageData,
): THREE.BufferGeometry {
  // Note: three's IcosahedronGeometry subdivides each edge into `detail` segments,
  // so triangle count is 20*(detail+1)^2 (linear), NOT 20*4^detail.
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const c = new THREE.Vector3();
  const col = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };

  for (let i = 0; i < pos.count; i += 3) {
    // Face centroid → lat/lng
    c.set(
      (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3,
      (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3,
      (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3,
    ).normalize();
    const lat = 90 - Math.acos(THREE.MathUtils.clamp(c.y, -1, 1)) * (180 / Math.PI);
    let lng = Math.atan2(c.z, -c.x) * (180 / Math.PI) - 180;
    lng = ((lng + 180) % 360 + 360) % 360 - 180;

    const oceanMask = sampleRGB(spec, lng, lat)[0]; // specular: bright = ocean
    const isOcean = oceanMask > 0.5;

    if (isOcean) {
      // Stylized ocean blue, slightly deeper where the day map is darker.
      const [, , b] = sampleRGB(day, lng, lat);
      col.setRGB(0.16, 0.42, 0.66, THREE.SRGBColorSpace);
      col.multiplyScalar(THREE.MathUtils.clamp(0.8 + b * 0.5, 0.7, 1.15));
    } else {
      // Land: take the real colour, gently lift saturation, posterize lightness into
      // bands. Keep saturation modest so noisy pixels don't turn into rainbow facets.
      const [r, g, b] = sampleRGB(day, lng, lat);
      col.setRGB(r, g, b, THREE.SRGBColorSpace);
      col.getHSL(hsl);
      hsl.s = Math.min(0.6, hsl.s * 1.1);
      hsl.l = Math.round(THREE.MathUtils.clamp(hsl.l, 0.2, 0.82) * 4) / 4;
      // Tiny per-face lightness jitter for a faceted, gem-like feel.
      hsl.l = THREE.MathUtils.clamp(hsl.l + ((((i / 3) % 3) - 1) * 0.02), 0.2, 0.88);
      col.setHSL(hsl.h, hsl.s, hsl.l);
    }

    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = col.r;
      colors[(i + k) * 3 + 1] = col.g;
      colors[(i + k) * 3 + 2] = col.b;
    }
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

interface GlobeProps {
  autoRotate: boolean;
}

export default function Globe({ autoRotate }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);

  const [dayMap, specMap] = useLoader(TextureLoader, [
    '/textures/earth_daymap.jpg',
    '/textures/earth_specular.jpg',
  ]);

  const geometry = useMemo(() => {
    const day = toImageData(dayMap.image as HTMLImageElement);
    const spec = toImageData(specMap.image as HTMLImageElement);
    return makeLowPolyEarth(GLOBE_RADIUS, 40, day, spec);
  }, [dayMap, specMap]);

  useFrame((_, delta) => {
    if (autoRotate && earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Faceted low-poly Earth — one flat colour per triangle */}
      <mesh ref={earthRef} geometry={geometry}>
        <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
      </mesh>

      {/* Soft cyan atmosphere rim */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.09, 48, 48]} />
        <shaderMaterial
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          uniforms={{ glowColor: { value: new THREE.Color(0x6fd6ff) } }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
              gl_FragColor = vec4(glowColor, intensity * 0.9);
            }
          `}
        />
      </mesh>
    </group>
  );
}
