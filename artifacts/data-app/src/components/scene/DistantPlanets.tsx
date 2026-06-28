import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type PlanetDef = {
  name: string;
  color: string;
  emissive: string;
  radius: number;
  distance: number;
  angle: number;
  inclination: number;
  ring?: boolean;
};

const PLANETS: PlanetDef[] = [
  { name: 'Mercury', color: '#9a958a', emissive: '#3a3830', radius: 0.14, distance: 28, angle: 0.4, inclination: 0.08 },
  { name: 'Venus', color: '#e8cda0', emissive: '#5a4030', radius: 0.22, distance: 32, angle: 1.1, inclination: -0.05 },
  { name: 'Mars', color: '#c1440e', emissive: '#401808', radius: 0.18, distance: 36, angle: 2.3, inclination: 0.12 },
  { name: 'Jupiter', color: '#c9906a', emissive: '#4a3020', radius: 0.55, distance: 40, angle: 3.4, inclination: -0.1 },
  { name: 'Saturn', color: '#e8d5a3', emissive: '#504830', radius: 0.48, distance: 38, angle: 4.2, inclination: 0.15, ring: true },
];

function planetPosition({ distance, angle, inclination }: PlanetDef) {
  return new THREE.Vector3(
    Math.cos(angle) * distance * Math.cos(inclination),
    Math.sin(inclination) * distance,
    Math.sin(angle) * distance * Math.cos(inclination)
  );
}

function Planet({ def }: { def: PlanetDef }) {
  const ref = useRef<THREE.Mesh>(null);
  const position = planetPosition(def);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.05;
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[def.radius, 24, 24]} />
        <meshStandardMaterial
          color={def.color}
          emissive={def.emissive}
          emissiveIntensity={0.35}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {def.ring && (
        <mesh rotation={[Math.PI / 2.8, 0.2, 0]}>
          <ringGeometry args={[def.radius * 1.35, def.radius * 2.1, 64]} />
          <meshStandardMaterial
            color="#c9b896"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export default function DistantPlanets() {
  return (
    <group>
      {PLANETS.map(planet => (
        <Planet key={planet.name} def={planet} />
      ))}
    </group>
  );
}
