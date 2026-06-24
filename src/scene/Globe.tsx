import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

export const GLOBE_RADIUS = 2;

interface GlobeProps {
  autoRotate: boolean;
}

export default function Globe({ autoRotate }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const dayMap = useLoader(TextureLoader, '/textures/earth_daymap.jpg');
  dayMap.colorSpace = THREE.SRGBColorSpace;

  // Cel-shading ramp: posterizes lighting into a few flat bands for a stylized look.
  const gradientMap = useMemo(() => {
    const steps = new Uint8Array([70, 130, 190, 245]);
    const tex = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Flat-shaded toon materials give the chunky, posterized low-poly look.
  // flatShading is honored by the renderer but missing from the toon material's
  // typings in this three version, so we set it on the instance.
  const landMaterial = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ map: dayMap, gradientMap });
    (m as unknown as { flatShading: boolean }).flatShading = true;
    m.needsUpdate = true;
    return m;
  }, [dayMap, gradientMap]);
  const oceanMaterial = useMemo(() => {
    const m = new THREE.MeshToonMaterial({
      color: new THREE.Color('#0b4a7a'),
      gradientMap,
      transparent: true,
      opacity: 0.35,
    });
    (m as unknown as { flatShading: boolean }).flatShading = true;
    m.needsUpdate = true;
    return m;
  }, [gradientMap]);

  useFrame((_, delta) => {
    if (autoRotate && earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Low-poly faceted Earth: coarse sphere + flatShading gives chunky triangles,
          toon material posterizes the shading. Equirectangular UVs keep continents readable. */}
      <mesh ref={earthRef} material={landMaterial}>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 24]} />
      </mesh>

      {/* Faceted ocean shell just under the surface so facet seams read as stylized edges */}
      <mesh scale={0.999} material={oceanMaterial}>
        <icosahedronGeometry args={[GLOBE_RADIUS, 6]} />
      </mesh>

      {/* Soft cyan atmosphere rim */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[GLOBE_RADIUS + 0.08, 48, 48]} />
        <shaderMaterial
          side={THREE.BackSide}
          transparent
          uniforms={{
            glowColor: { value: new THREE.Color(0x6fd6ff) },
          }}
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
              float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
              gl_FragColor = vec4(glowColor, intensity * 0.9);
            }
          `}
        />
      </mesh>
    </group>
  );
}
