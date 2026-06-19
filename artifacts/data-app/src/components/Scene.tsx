import { useRef, useMemo } from 'react';
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
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function deterministicAngle(id: string): number {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
  return (h * 0.6180339887) % (Math.PI * 2);
}

function deterministicInclination(id: string): number {
  const h = id.split('').reduce((a, c) => (a * 17 + c.charCodeAt(0)) & 0x7fffffff, 1);
  return ((h * 0.3819660112) % 1 - 0.5) * (Math.PI * 0.45);
}

function buildFlybyCurve(
  baseAngle: number,
  periapsis: number,
  inclination: number
): THREE.CatmullRomCurve3 {
  const far = Math.max(periapsis * 5, 18);
  const halfTurn = THREE.MathUtils.lerp(
    Math.PI * 0.38, Math.PI * 0.10,
    Math.min(periapsis / 12, 1)
  );
  const inA = baseAngle + halfTurn;
  const outA = baseAngle - halfTurn;
  const inc = inclination;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(Math.cos(inA) * far,           Math.sin(inc) * far * 0.30,           Math.sin(inA) * far),
    new THREE.Vector3(Math.cos(inA) * periapsis * 2.5, Math.sin(inc) * periapsis * 0.50,   Math.sin(inA) * periapsis * 2.5),
    new THREE.Vector3(Math.cos(baseAngle) * periapsis, 0,                                   Math.sin(baseAngle) * periapsis),
    new THREE.Vector3(Math.cos(outA) * periapsis * 2.5, -Math.sin(inc) * periapsis * 0.50, Math.sin(outA) * periapsis * 2.5),
    new THREE.Vector3(Math.cos(outA) * far,           -Math.sin(inc) * far * 0.30,          Math.sin(outA) * far),
  ]);
}

function trajectoryT(approachDateStr: string): number {
  const days = (new Date(approachDateStr).getTime() - Date.now()) / 86400000;
  return Math.max(0.03, Math.min(0.97, 0.5 - days / 14));
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  useFrame(() => { if (earthRef.current) earthRef.current.rotation.y += 0.001; });
  return (
    <group>
      <Sphere ref={earthRef} args={[1, 64, 64]}>
        <meshStandardMaterial color="#1e5c8c" emissive="#0d2b45" emissiveIntensity={0.2} roughness={0.8} />
      </Sphere>
      <Sphere args={[1.05, 32, 32]}>
        <meshBasicMaterial color="#4ea8de" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </Sphere>
    </group>
  );
}

function PeriapsisMarker({ position, isHazardous }: { position: THREE.Vector3; isHazardous: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + 0.35 * Math.sin(clock.elapsedTime * 3);
      ref.current.scale.setScalar(s);
    }
  });
  const color = isHazardous ? '#ff6644' : '#aaddff';
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <Html position={[0, 0.35, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.88)',
          color: '#fff',
          padding: '2px 7px',
          fontSize: '10px',
          borderRadius: '4px',
          border: `1px solid ${isHazardous ? 'rgba(255,100,68,0.5)' : 'rgba(170,220,255,0.4)'}`,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          letterSpacing: '0.04em',
        }}>
          ◆ CLOSEST APPROACH
        </div>
      </Html>
    </group>
  );
}

function NeoObject({
  neo,
  isSelected,
  onClick,
}: {
  neo: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const baseAngle    = useMemo(() => deterministicAngle(neo.id), [neo.id]);
  const inclination  = useMemo(() => deterministicInclination(neo.id), [neo.id]);
  const periapsis    = useMemo(() =>
    Math.max(1.5, Math.min(neo.nextCloseApproach.missDistanceLunar * 2, 14)),
    [neo.nextCloseApproach.missDistanceLunar]
  );
  const curve        = useMemo(() => buildFlybyCurve(baseAngle, periapsis, inclination), [baseAngle, periapsis, inclination]);
  const t0           = useMemo(() => trajectoryT(neo.nextCloseApproach.date), [neo.nextCloseApproach.date]);
  const periapsisPos = useMemo(() => curve.getPoint(0.5), [curve]);

  const linePoints = useMemo(
    () => curve.getPoints(80).map(p => [p.x, p.y, p.z] as [number, number, number]),
    [curve]
  );

  const hazard = neo.isPotentiallyHazardous;
  const color  = hazard ? '#ff3333' : (neo.estimatedDiameterMaxKm > 0.5 ? '#ffaa00' : '#33ccff');
  const size   = 0.05 + Math.log10(neo.estimatedDiameterMaxKm * 10 + 1) * 0.05;

  const daysUntil = (new Date(neo.nextCloseApproach.date).getTime() - Date.now()) / 86400000;
  const statusLabel = daysUntil > 0.5
    ? `Approaching · ${daysUntil.toFixed(1)}d`
    : daysUntil < -0.5
      ? `Receding · ${Math.abs(daysUntil).toFixed(1)}d ago`
      : 'CLOSEST APPROACH TODAY';

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = curve.getPoint(t0);
    meshRef.current.position.set(pos.x, pos.y, pos.z);
    meshRef.current.rotation.y += 0.008;
  });

  return (
    <group>
      {/* Trajectory arc */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={isSelected ? 2.5 : 1.2}
        transparent
        opacity={isSelected ? 1.0 : 0.45}
        dashed={!isSelected}
        dashSize={0.35}
        gapSize={0.15}
      />

      {/* Closest-approach marker — only for selected */}
      {isSelected && (
        <PeriapsisMarker position={periapsisPos} isHazardous={hazard} />
      )}

      {/* Asteroid sphere — positioned on trajectory */}
      <Sphere
        ref={meshRef}
        args={[size, 16, 16]}
        onClick={e => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.0 : (hazard ? 0.7 : 0.2)}
        />
        {/* Name label always visible for selected; hover only otherwise */}
        {isSelected && (
          <Html position={[0, size + 0.25, 0]} center>
            <div style={{
              background: 'rgba(0,0,0,0.88)',
              color: '#fff',
              padding: '3px 9px',
              fontSize: '11px',
              borderRadius: '4px',
              border: `1px solid ${hazard ? 'rgba(255,80,50,0.5)' : 'rgba(255,255,255,0.2)'}`,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}>
              <span style={{ fontWeight: 700 }}>{neo.name}</span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
                {statusLabel}
              </span>
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

      {data?.objects.map(neo => (
        <NeoObject
          key={neo.id}
          neo={neo}
          isSelected={neo.id === selectedNeoId}
          onClick={() => onSelectNeo(neo.id)}
        />
      ))}

      <OrbitControls enablePan enableZoom minDistance={2} maxDistance={22} />
    </>
  );
}

const NoWebGLFallback = () => (
  <div style={{ width: '100%', height: '100%', background: '#030308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: 'monospace', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
      3D visualization requires WebGL.<br />
      Open this app in a browser with hardware acceleration enabled to see the full 3D view.
    </div>
  </div>
);

export default function Scene({ selectedNeoId, onSelectNeo }: { selectedNeoId: string | null; onSelectNeo: (id: string) => void }) {
  return (
    <WebGLErrorBoundary fallback={<NoWebGLFallback />}>
      <Canvas camera={{ position: [0, 6, 12], fov: 45 }}>
        <SceneContents selectedNeoId={selectedNeoId} onSelectNeo={onSelectNeo} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
