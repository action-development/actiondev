"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const GLB_PATH = "/3d/action-globe.glb";
const MODEL_NATIVE_WIDTH = 9.58;

const PHASE = {
  INTRO_END: 0.10,
  FLY_END: 0.25,
  BELT_START: 0.25,
  BELT_END: 0.78,
  RETURN_END: 0.88,
  FOOTER_START: 0.88,
};

const INFO_ITEMS = [
  { label: "We are", text: "Action Development" },
  { label: "A digital", text: "product studio" },
  { label: "Turning ideas into", text: "real experiences" },
  { label: "We build", text: "apps & webs" },
  { label: "Native mobile to", text: "full-stack platforms" },
  { label: "Based in", text: "Vigo, Galicia" },
  { label: "Working with", text: "clients worldwide" },
  { label: "Powered by", text: "caffeine & code" },
  { label: "Let's build", text: "something together" },
  { label: "Say hi →", text: "hi@actiondev.es" },
];

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

  const topY = viewport.height / 2 - 0.35;
  const centerY = -0.2;
  const smallScale = 0.045;
  const bigScale = (viewport.width * 0.35) / MODEL_NATIVE_WIDTH;

  const FLIP_DURATION = 0.5;
  const PAUSE_DURATION = 1.8;
  const CYCLE = FLIP_DURATION + PAUSE_DURATION;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const p = progress;

    // Auto coin flip in idle phases
    const doFlip = () => {
      timeRef.current += delta;
      const cycleTime = timeRef.current % CYCLE;
      if (cycleTime < FLIP_DURATION) {
        const t = cycleTime / FLIP_DURATION;
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const base = Math.floor(timeRef.current / CYCLE) * Math.PI;
        g.rotation.y = base + eased * Math.PI;
      }
    };

    if (p < PHASE.INTRO_END) {
      g.position.set(0, topY, 0);
      g.scale.setScalar(smallScale);
      g.rotation.x = 0;
      g.rotation.z = 0;
      doFlip();
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
      doFlip();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={centeredScene} />
    </group>
  );
}

function ConveyorBelt({ progress }: { progress: number }) {
  const beltProgress = (progress - PHASE.BELT_START) / (PHASE.BELT_END - PHASE.BELT_START);

  if (beltProgress < -0.05 || beltProgress > 1.05) return null;

  const totalItems = INFO_ITEMS.length;
  // Each item travels the full viewport height (from 120% bottom to -20% top)
  // Spacing between items in progress units
  const spacing = 1 / totalItems;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {INFO_ITEMS.map((item, i) => {
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

function Footer({ progress }: { progress: number }) {
  const opacity = smoothstep(PHASE.FOOTER_START, PHASE.FOOTER_START + 0.06, progress);
  if (opacity <= 0.01) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-black px-8 py-10"
      style={{ opacity }}
    >
      <h3 className="text-lg font-bold text-white">Action Dev</h3>
      <a
        href="mailto:hi@actiondev.es"
        className="pointer-events-auto text-sm font-medium tracking-wider text-white/60 uppercase transition-colors active:text-white"
      >
        hi@actiondev.es
      </a>
      <div className="flex items-center gap-6">
        <a href="#" className="pointer-events-auto text-white/40 transition-colors active:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
        <a href="#" className="pointer-events-auto text-white/40 transition-colors active:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        </a>
      </div>
      <span className="mt-2 text-xs text-white/20">© {new Date().getFullYear()} Action Development</span>
    </div>
  );
}

export default function AboutExperience({ progress }: { progress: number }) {
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
        <h1 className="text-6xl font-bold text-black">About</h1>
        {progress < 0.02 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-sm font-medium tracking-wider text-black/30 uppercase">Keep scrolling</span>
            <svg className="animate-bounce text-black/30" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        )}
      </div>

      {/* Conveyor belt text */}
      <ConveyorBelt progress={progress} />

      {/* Footer */}
      <Footer progress={progress} />
    </div>
  );
}

useGLTF.preload(GLB_PATH);
