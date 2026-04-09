"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const GLB_PATH = "/3d/action-globe.glb";
const MODEL_NATIVE_WIDTH = 9.58;

function SpinningGlobe() {
  const { scene } = useGLTF(GLB_PATH);
  const groupRef = useRef<THREE.Group>(null);

  const centeredScene = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        (node as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: 0x000000,
        });
      }
    });
    return clone;
  }, [scene]);

  // Coin-flip: fast rotation between flat faces, pauses on each
  const timeRef = useRef(0);
  const FLIP_DURATION = 0.5; // seconds for the flip
  const PAUSE_DURATION = 1.8; // seconds resting on each face
  const CYCLE = FLIP_DURATION + PAUSE_DURATION;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    const cycleTime = timeRef.current % CYCLE;

    if (cycleTime < FLIP_DURATION) {
      // Flipping — easeInOutCubic for snappy feel
      const t = cycleTime / FLIP_DURATION;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const baseAngle = Math.floor(timeRef.current / CYCLE) * Math.PI;
      groupRef.current.rotation.y = baseAngle + eased * Math.PI;
    }
    // else: pause — rotation stays at the flat face
  });

  // Scale so the model fills the small canvas nicely
  const scale = 1 / MODEL_NATIVE_WIDTH;

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={centeredScene} />
    </group>
  );
}

export default function LogoHeader3D({
  onClick,
  visible,
}: {
  onClick: () => void;
  visible: boolean;
}) {
  return (
    <div
      data-logo
      className={`h-10 w-10 cursor-pointer transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1.2], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "none" }}
      >
        <SpinningGlobe />
      </Canvas>
    </div>
  );
}

useGLTF.preload(GLB_PATH);
