import * as THREE from 'three';

/** World-space direction from Earth toward the Sun (normalized). */
export const SUN_DIRECTION = new THREE.Vector3(-0.85, 0.25, -0.45).normalize();

/** Distance from Earth origin to the visible Sun disc. */
export const SUN_DISTANCE = 42;

/** Shared sun position used for lighting and the Sun mesh. */
export const SUN_POSITION = SUN_DIRECTION.clone().multiplyScalar(SUN_DISTANCE);
