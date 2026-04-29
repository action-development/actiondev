import * as THREE from "three";

/**
 * Module-level scratch objects allocated once at import time.
 * useFrame is single-threaded (RAF), so sharing across modules is safe as long as
 * each call site reads → uses → discards within the same tick. Never hold a ref
 * to these between frames.
 */
export const scratchVec3A = new THREE.Vector3();
export const scratchVec3B = new THREE.Vector3();
export const scratchVec3C = new THREE.Vector3();
export const scratchObj3D = new THREE.Object3D();
export const scratchMatrix4 = new THREE.Matrix4();
export const scratchQuat = new THREE.Quaternion();

/** Plain-object scratch for Rapier interop — Rapier reads {x,y,z}, no Three classes needed. */
export const scratchRapierVec = { x: 0, y: 0, z: 0 };
