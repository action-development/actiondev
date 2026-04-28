"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useCenteredBlackModel, applyCoinFlip } from "@/lib/model-utils";

const GLB_PATH = "/3d/action-globe.glb";
const MODEL_NATIVE_WIDTH = 9.58;

function SpinningGlobe() {
  const { scene } = useGLTF(GLB_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const centeredScene = useCenteredBlackModel(scene);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    applyCoinFlip(groupRef.current, timeRef, delta);
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
