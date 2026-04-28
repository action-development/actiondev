import { useMemo, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * Clone a GLTF scene, center it at origin, and force a flat black material on all meshes.
 * Memoized on `scene` — stable across re-renders.
 */
export function useCenteredBlackModel(scene: THREE.Object3D): THREE.Object3D {
	return useMemo(() => {
		const clone = scene.clone();
		const box = new THREE.Box3().setFromObject(clone);
		clone.position.sub(box.getCenter(new THREE.Vector3()));
		clone.traverse((node) => {
			if ((node as THREE.Mesh).isMesh) {
				(node as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0x000000 });
			}
		});
		return clone;
	}, [scene]);
}

/** Apply easeInOutCubic coin-flip rotation on Y. Advances timeRef by delta each call. */
export function applyCoinFlip(
	group: THREE.Object3D,
	timeRef: MutableRefObject<number>,
	delta: number,
): void {
	const FLIP = 0.5;
	const CYCLE = FLIP + 1.8;
	timeRef.current += delta;
	const cycleTime = timeRef.current % CYCLE;
	if (cycleTime >= FLIP) return;
	const t = cycleTime / FLIP;
	const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	group.rotation.y = Math.floor(timeRef.current / CYCLE) * Math.PI + eased * Math.PI;
}
