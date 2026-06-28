import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SUN_DIRECTION } from './constants';

const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    vec3 normal = normalize(vNormalW);
    float sunDot = dot(normal, sunDirection);
    float dayMix = smoothstep(-0.15, 0.25, sunDot);

    vec3 dayColor = texture2D(dayMap, vUv).rgb;
    vec3 nightColor = texture2D(nightMap, vUv).rgb;
    vec3 color = mix(nightColor * 1.4, dayColor, dayMix);

    float spec = texture2D(specularMap, vUv).r;
    float specular = pow(max(sunDot, 0.0), 8.0) * spec * 0.35;
    color += vec3(specular);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDirW;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDirW = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDirW;

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormalW, vViewDirW), 0.0), 2.5);
    vec3 glow = vec3(0.35, 0.65, 1.0) * fresnel;
    gl_FragColor = vec4(glow, fresnel * 0.55);
  }
`;

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, normalMap, specularMap, cloudMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_night.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
  ]);

  useEffect(() => {
    for (const map of [dayMap, nightMap, cloudMap]) {
      map.colorSpace = THREE.SRGBColorSpace;
    }
  }, [dayMap, nightMap, cloudMap]);

  const earthMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: dayMap },
          nightMap: { value: nightMap },
          specularMap: { value: specularMap },
          sunDirection: { value: SUN_DIRECTION.clone() },
        },
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
      }),
    [dayMap, nightMap, specularMap]
  );

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0008;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0012;
  });

  return (
    <group>
      <Sphere ref={earthRef} args={[1, 64, 64]} material={earthMaterial} />
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.012, 64, 64]} />
        <meshStandardMaterial
          map={cloudMap}
          transparent
          opacity={0.55}
          depthWrite={false}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
        />
      </mesh>
      <Sphere args={[1.035, 64, 64]} material={atmosphereMaterial} />
    </group>
  );
}
