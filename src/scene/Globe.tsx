import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

export const GLOBE_RADIUS = 2;

// Build a low-poly icosphere whose UVs are recomputed as a proper equirectangular
// mapping, so the day texture lands on uniform triangular facets with continents
// still aligned to latLngToVector3. Per-face (non-indexed) UVs let us fix the
// longitude seam without smearing a stripe across the globe.
function makeLowPolyEarth(radius: number, detail: number): THREE.BufferGeometry {
  // IcosahedronGeometry is already non-indexed (one set of vertices per face),
  // which is exactly what we want for per-face UV seam fixing + flat shading.
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const phi = Math.acos(THREE.MathUtils.clamp(v.y, -1, 1)); // 0..π from north pole
    let theta = Math.atan2(v.z, -v.x); // matches latLngToVector3
    if (theta < 0) theta += Math.PI * 2;
    uv[i * 2] = theta / (Math.PI * 2);
    uv[i * 2 + 1] = 1 - phi / Math.PI;
  }

  // Seam fix: triangles that straddle the antimeridian get a huge U spread.
  for (let i = 0; i < pos.count; i += 3) {
    const a = uv[i * 2];
    const b = uv[(i + 1) * 2];
    const c = uv[(i + 2) * 2];
    if (Math.max(a, b, c) - Math.min(a, b, c) > 0.5) {
      if (a < 0.5) uv[i * 2] += 1;
      if (b < 0.5) uv[(i + 1) * 2] += 1;
      if (c < 0.5) uv[(i + 2) * 2] += 1;
    }
  }

  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

interface GlobeProps {
  autoRotate: boolean;
}

export default function Globe({ autoRotate }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);

  const dayMap = useLoader(TextureLoader, '/textures/earth_daymap.jpg');
  dayMap.colorSpace = THREE.SRGBColorSpace;
  dayMap.wrapS = THREE.RepeatWrapping; // lets seam-fixed UVs (u > 1) sample correctly

  const geometry = useMemo(() => makeLowPolyEarth(GLOBE_RADIUS, 3), []);

  // Flat-shaded + posterized colours give a stylised, painterly low-poly planet.
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: dayMap,
      flatShading: true,
      roughness: 1,
      metalness: 0,
    });
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         // Quantise the final colour into flat bands for a stylised look,
         // mixed back slightly so hues stay natural rather than garish.
         vec3 posterized = floor(gl_FragColor.rgb * 5.0 + 0.5) / 5.0;
         gl_FragColor.rgb = mix(gl_FragColor.rgb, posterized, 0.78);`,
      );
    };
    return m;
  }, [dayMap]);

  useFrame((_, delta) => {
    if (autoRotate && earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Faceted, posterized low-poly Earth */}
      <mesh ref={earthRef} geometry={geometry} material={material} />

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
