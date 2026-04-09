"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const GLB_PATH = "/3d/action-globe.glb";

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

type Phase = "fly-in" | "spin" | "fly-back";

function AnimatedGlobe({
  startPos,
  centerPos,
  startScale,
  endScale,
  onComplete,
}: {
  startPos: [number, number, number];
  centerPos: [number, number, number];
  startScale: number;
  endScale: number;
  onComplete: () => void;
}) {
  const { scene } = useGLTF(GLB_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef<Phase>("fly-in");
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  // Clone scene, center geometry, and force pure black material
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

  // Get the model's native width to calculate proper scale
  const modelWidth = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size.x; // ~9.58 units
  }, [scene]);

  const FLY_DURATION = 1.4;
  const SPIN_ROTATIONS = 3;
  const SPIN_DURATION = 2.0;
  const FLYBACK_DURATION = 1.2;

  useFrame((_, delta) => {
    if (!groupRef.current || completedRef.current) return;

    const group = groupRef.current;
    const phase = phaseRef.current;
    progressRef.current += delta;

    if (phase === "fly-in") {
      const t = Math.min(progressRef.current / FLY_DURATION, 1);
      const eased = easeOutCubic(t);

      group.position.x = THREE.MathUtils.lerp(startPos[0], centerPos[0], eased);
      group.position.y = THREE.MathUtils.lerp(startPos[1], centerPos[1], eased);

      const s = THREE.MathUtils.lerp(startScale, endScale, eased);
      group.scale.setScalar(s);

      group.rotation.y = t * Math.PI * 2;

      if (t >= 1) {
        phaseRef.current = "spin";
        progressRef.current = 0;
      }
    } else if (phase === "spin") {
      const t = Math.min(progressRef.current / SPIN_DURATION, 1);
      const eased = easeInOutQuart(t);

      group.rotation.y = eased * Math.PI * 2 * SPIN_ROTATIONS;
      group.rotation.x = Math.sin(eased * Math.PI * 6) * 0.2;

      const pulse = 1 + Math.sin(eased * Math.PI * 3) * 0.1;
      group.scale.setScalar(endScale * pulse);

      if (t >= 1) {
        phaseRef.current = "fly-back";
        progressRef.current = 0;
        group.rotation.x = 0;
      }
    } else if (phase === "fly-back") {
      const t = Math.min(progressRef.current / FLYBACK_DURATION, 1);
      const eased = easeInOutCubic(t);

      group.position.x = THREE.MathUtils.lerp(centerPos[0], startPos[0], eased);
      group.position.y = THREE.MathUtils.lerp(centerPos[1], startPos[1], eased);

      const s = THREE.MathUtils.lerp(endScale, startScale, eased);
      group.scale.setScalar(s);

      group.rotation.y = eased * Math.PI * 2;

      if (t >= 1 && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }
  });

  return (
    <group ref={groupRef} position={startPos} scale={startScale}>
      <primitive object={centeredScene} />
    </group>
  );
}

function Scene({
  logoRect,
  targetRect,
  onComplete,
}: {
  logoRect: DOMRect;
  targetRect: DOMRect;
  onComplete: () => void;
}) {
  const { viewport, size } = useThree();

  // Convert DOM px → Three.js world coords
  const toWorld = (px: number, py: number): [number, number, number] => {
    const x = ((px / size.width) * 2 - 1) * (viewport.width / 2);
    const y = (-(py / size.height) * 2 + 1) * (viewport.height / 2);
    return [x, y, 0];
  };

  const startPos = toWorld(
    logoRect.left + logoRect.width / 2,
    logoRect.top + logoRect.height / 2
  );

  const centerPos = toWorld(
    targetRect.left + targetRect.width / 2,
    targetRect.top + targetRect.height / 2
  );

  // The model is ~9.58 units wide natively.
  // We need scale factors so that:
  //   startScale * 9.58 = logoWidth in world units  (match the 2D logo size)
  //   endScale * 9.58 = ~40% of viewport width      (dramatic but not overwhelming)
  const MODEL_NATIVE_WIDTH = 9.58;

  // Logo width in world units
  const logoWorldWidth = (logoRect.width / size.width) * viewport.width;
  const startScale = logoWorldWidth / MODEL_NATIVE_WIDTH;

  // Target: 40% of viewport at center
  const endScale = (viewport.width * 0.4) / MODEL_NATIVE_WIDTH;

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, -3, 2]} intensity={0.4} />
      <AnimatedGlobe
        startPos={startPos}
        centerPos={centerPos}
        startScale={startScale}
        endScale={endScale}
        onComplete={onComplete}
      />
    </>
  );
}

export default function Logo3DEasterEgg({
  active,
  logoRect,
  targetRect,
  onAnimationEnd,
}: {
  active: boolean;
  logoRect: DOMRect | null;
  targetRect: DOMRect | null;
  onAnimationEnd: () => void;
}) {
  if (!active || !logoRect || !targetRect) return null;

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ pointerEvents: "none" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene logoRect={logoRect} targetRect={targetRect} onComplete={onAnimationEnd} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(GLB_PATH);
