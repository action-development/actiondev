"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";

/** R3F component: triggers a Canvas invalidation on every scroll event (rAF-gated). */
export function ScrollInvalidator() {
	const { invalidate } = useThree();
	useEffect(() => {
		invalidate();
		let pending = false;
		const handler = () => {
			if (pending) return;
			pending = true;
			requestAnimationFrame(() => {
				invalidate();
				pending = false;
			});
		};
		window.addEventListener("scroll", handler, { passive: true });
		return () => window.removeEventListener("scroll", handler);
	}, [invalidate]);
	return null;
}

/** Canvas onCreated: sets a transparent background and pre-compiles the scene. */
export function onCanvasCreated({ gl, scene, camera }: Pick<RootState, "gl" | "scene" | "camera">) {
	gl.setClearColor(0x000000, 0);
	scene.background = null;
	gl.compile(scene, camera);
}
