import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SUN_POSITION } from './constants';

export default function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const [sunTexture] = useTexture(['/textures/sun.jpg']);

  useEffect(() => {
    sunTexture.colorSpace = THREE.SRGBColorSpace;
  }, [sunTexture]);

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.6) * 0.04;
    if (sunRef.current) sunRef.current.scale.setScalar(pulse);
    if (coronaRef.current) coronaRef.current.scale.setScalar(pulse * 1.35);
  });

  return (
    <group position={SUN_POSITION.toArray()}>
      <Sphere ref={sunRef} args={[2.2, 32, 32]}>
        <meshBasicMaterial map={sunTexture} color="#fff4cc" toneMapped={false} />
      </Sphere>
      <Sphere ref={coronaRef} args={[2.2, 32, 32]}>
        <meshBasicMaterial
          color="#ffaa33"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>
    </group>
  );
}

export function SunLight() {
  return (
    <>
      <directionalLight
        position={SUN_POSITION.toArray()}
        intensity={2.8}
        color="#fff6e8"
        castShadow={false}
      />
      <ambientLight intensity={0.08} color="#1a2040" />
    </>
  );
}
