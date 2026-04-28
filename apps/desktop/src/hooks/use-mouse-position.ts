"use client";

import { useRef, useEffect, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * Track mouse NDC position via window mousemove events. Returns stable ref — no re-renders.
 * Uses raw DOM events instead of R3F's canvas event system so position updates reliably
 * while the mouse button is held (R3F's pointer only updates when canvas receives pointermove,
 * which browsers may suppress during drag operations).
 */
export function useMousePosition(): MutableRefObject<THREE.Vector2> {
  const pos = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      pos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return pos;
}
