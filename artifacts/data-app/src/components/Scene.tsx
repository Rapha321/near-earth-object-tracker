import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useGetApproachingNeo } from '@workspace/api-client-react';
import { Component, type ReactNode } from 'react';

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#1e5c8c"
          emissive="#0d2b45"
          emissiveIntensity={0.2}
          roughness={0.8}
        />
      </Sphere>
      <Sphere args={[1.05, 32, 32]}>
        <meshBasicMaterial
          color="#4ea8de"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}

function OrbitRing({ radius, color = "#ffffff", opacity = 0.1 }: { radius: number; color?: string; opacity?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.02, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function NeoSphere({ neo, isSelected, onClick }: { neo: any; isSelected: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const [angle] = useState(() => Math.random() * Math.PI * 2);
  const [speed] = useState(() => 0.001 + Math.random() * 0.002);

  const hazard = neo.isPotentiallyHazardous;
  const large = neo.estimatedDiameterMaxKm > 0.5;
  const color = hazard ? "#ff3333" : large ? "#ffaa00" : "#33ccff";

  const baseSize = 0.05;
  const size = baseSize + Math.log10(neo.estimatedDiameterMaxKm * 10 + 1) * 0.05;

  const distance = Math.max(1.5, Math.min(neo.nextCloseApproach.missDistanceLunar * 2, 14));

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.x = Math.cos(angle + t * speed) * distance;
      ref.current.position.z = Math.sin(angle + t * speed) * distance;
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <Sphere
        ref={ref}
        args={[size, 16, 16]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hazard ? 0.8 : 0.2}
        />
        {isSelected && (
          <Html position={[0, size + 0.2, 0]} center>
            <div style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '2px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap', fontFamily: 'monospace', pointerEvents: 'none' }}>
              {neo.name}
            </div>
          </Html>
        )}
      </Sphere>
    </group>
  );
}

function SceneContents({ selectedNeoId, onSelectNeo }: { selectedNeoId: string | null; onSelectNeo: (id: string) => void }) {
  const { data } = useGetApproachingNeo();

  return (
    <>
      <color attach="background" args={["#030308"]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Earth />

      <OrbitRing radius={2} color="#ffffff" opacity={0.1} />
      <OrbitRing radius={8} color="#4ea8de" opacity={0.05} />

      {data?.objects.map(neo => (
        <NeoSphere
          key={neo.id}
          neo={neo}
          isSelected={neo.id === selectedNeoId}
          onClick={() => onSelectNeo(neo.id)}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={20}
      />
    </>
  );
}

const NoWebGLFallback = () => (
  <div style={{ width: '100%', height: '100%', background: '#030308', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: 'monospace', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
      3D visualization requires WebGL.<br />
      Open this app in a browser with hardware acceleration enabled to see the full 3D view.
    </div>
  </div>
);

export default function Scene({ selectedNeoId, onSelectNeo }: { selectedNeoId: string | null; onSelectNeo: (id: string) => void }) {
  return (
    <WebGLErrorBoundary fallback={<NoWebGLFallback />}>
      <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
        <SceneContents selectedNeoId={selectedNeoId} onSelectNeo={onSelectNeo} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
