"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCenteredBlackModel, applyCoinFlip } from "@/lib/model-utils";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import EndPanelContent from "./EndPanel";
import { useI18n } from "@/lib/i18n/context";

const GLB_PATH = "/3d/action-globe.glb";
const MODEL_NATIVE_WIDTH = 9.58;

const PHASE = {
  INTRO_END: 0.10,
  FLY_END: 0.25,
  BELT_START: 0.25,
  BELT_END: 0.78,
  RETURN_END: 0.88,
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function ScrollGlobe({ progress }: { progress: number }) {
  const { scene } = useGLTF(GLB_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const { viewport } = useThree();

  const centeredScene = useCenteredBlackModel(scene);

  const topY = viewport.height / 2 - 0.35;
  const centerY = -0.2;
  const smallScale = 0.045;
  const bigScale = (viewport.width * 0.35) / MODEL_NATIVE_WIDTH;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const p = progress;

    if (p < PHASE.INTRO_END) {
      g.position.set(0, topY, 0);
      g.scale.setScalar(smallScale);
      g.rotation.x = 0;
      g.rotation.z = 0;
      applyCoinFlip(g, timeRef, delta);
    } else if (p < PHASE.FLY_END) {
      const t = smoothstep(PHASE.INTRO_END, PHASE.FLY_END, p);
      g.position.set(0, lerp(topY, centerY, t), 0);
      g.scale.setScalar(lerp(smallScale, bigScale, t));
      g.rotation.y = t * Math.PI * 3;
      g.rotation.x = Math.sin(t * Math.PI) * 0.3;
      g.rotation.z = 0;
    } else if (p < PHASE.BELT_END) {
      const t = (p - PHASE.BELT_START) / (PHASE.BELT_END - PHASE.BELT_START);
      g.position.set(0, centerY, 0);
      g.scale.setScalar(bigScale);
      g.rotation.y = t * Math.PI * 8;
      g.rotation.x = Math.sin(t * Math.PI * 5) * 0.35;
      g.rotation.z = Math.cos(t * Math.PI * 3) * 0.12;
    } else if (p < PHASE.RETURN_END) {
      const t = smoothstep(PHASE.BELT_END, PHASE.RETURN_END, p);
      g.position.set(0, lerp(centerY, topY, t), 0);
      g.scale.setScalar(lerp(bigScale, smallScale, t));
      g.rotation.y = t * Math.PI * 2;
      g.rotation.x = lerp(0.35, 0, t);
      g.rotation.z = 0;
    } else {
      g.position.set(0, topY, 0);
      g.scale.setScalar(smallScale);
      g.rotation.x = 0;
      g.rotation.z = 0;
      applyCoinFlip(g, timeRef, delta);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={centeredScene} />
    </group>
  );
}

function ConveyorBelt({ progress }: { progress: number }) {
  const { t } = useI18n();
  const items = t.about.items;
  const beltProgress = (progress - PHASE.BELT_START) / (PHASE.BELT_END - PHASE.BELT_START);

  if (beltProgress < -0.05 || beltProgress > 1.05) return null;

  const totalItems = items.length;
  // Each item travels the full viewport height (from 120% bottom to -20% top)
  // Spacing between items in progress units
  const spacing = 1 / totalItems;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item, i) => {
        // Each item's position: starts at bottom, moves to top
        const itemProgress = beltProgress - i * spacing;
        // Map to Y position: 0 = bottom of screen, 1 = top of screen
        const yPercent = 110 - itemProgress * 140;
        // Fade based on distance from center
        const distFromCenter = Math.abs(yPercent - 50) / 50;
        const opacity = Math.max(0, 1 - distFromCenter * 1.2);

        if (opacity <= 0.01) return null;

        // Alternate left/right positioning
        const isLeft = i % 2 === 0;

        return (
          <div
            key={i}
            className={`absolute flex flex-col gap-0.5 ${isLeft ? "left-7 items-start text-left" : "right-7 items-end text-right"}`}
            style={{
              top: `${yPercent}%`,
              opacity,
              transform: `translateY(-50%)`,
            }}
          >
            <span className="text-xs font-medium tracking-wider text-black/35 uppercase">
              {item.label}
            </span>
            <span className="text-2xl font-bold text-black">
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AboutExperience({ progress }: { progress: number }) {
  const { t } = useI18n();
  const titleOpacity = 1 - smoothstep(PHASE.INTRO_END, PHASE.INTRO_END + 0.06, progress);

  return (
    <div className="relative h-full w-full">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "none" }}
        className="absolute inset-0"
      >
        <ScrollGlobe progress={progress} />
      </Canvas>

      {/* Title */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        style={{ opacity: titleOpacity }}
      >
        <h1 className="text-6xl font-bold text-black">{t.about.title}</h1>
        {progress < 0.02 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-sm font-medium tracking-wider text-black/30 uppercase">{t.about.scrollHint}</span>
            <svg className="animate-bounce text-black/30" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        )}
      </div>

      {/* Conveyor belt text */}
      <ConveyorBelt progress={progress} />

      {/* End-of-scroll panel: AI links + footer */}
      {(() => {
        const endOpacity = smoothstep(PHASE.RETURN_END, PHASE.RETURN_END + 0.06, progress);
        if (endOpacity <= 0.01) return null;
        return (
          <div
            className="absolute inset-0"
            style={{
              opacity: endOpacity,
              pointerEvents: endOpacity > 0.9 ? "auto" : "none",
            }}
          >
            <EndPanelContent />
          </div>
        );
      })()}
    </div>
  );
}

useGLTF.preload(GLB_PATH);
