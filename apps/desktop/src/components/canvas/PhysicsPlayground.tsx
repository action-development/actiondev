"use client";

import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics, CuboidCollider } from "@react-three/rapier";
import { Environment, Preload } from "@react-three/drei";
import { ProjectNode } from "./ProjectNode";
import { BlackHole } from "./BlackHole";
import { Starfield } from "./Starfield";
import { ProjectModal } from "./ProjectModal";
import { projects, type Project } from "@/data/projects";

/**
 * PhysicsPlayground — The gravity simulator that IS the homepage.
 *
 * ### Scene architecture:
 *
 * ```
 * Canvas (fullscreen, black bg, fov 50)
 *  ├── Starfield (1200 instanced stars, no physics)
 *  ├── Lighting (ambient + directional + Environment)
 *  └── Physics (Rapier, low gravity [0, -1.5, 0])
 *       ├── CuboidColliders × 6 (invisible walls — box containment)
 *       ├── ProjectNode × N (from projects data, draggable, bouncy)
 *       └── BlackHole (gravitational attractor + capture sensor)
 * ```
 *
 * ### Design decisions:
 *
 * - **Low gravity** (not zero): Objects gently drift downward, creating
 *   natural motion without feeling static. Combined with the BlackHole's
 *   gravitational pull, objects will slowly orbit/spiral inward.
 *
 * - **Wall containment**: 6 invisible CuboidColliders form a box.
 *   Sized to match typical viewport proportions at fov 50.
 *
 * - **Environment preset "night"**: Dark reflections on glass materials.
 *   Using "city" was too bright for a space scene.
 *
 * - **Modal state**: Lifted to this component. When BlackHole captures a
 *   project, we render ProjectModal as a DOM overlay on top of the Canvas.
 */

/** Color palette for project nodes — brand-aligned, high contrast on dark */
const PROJECT_COLORS = ["#4f46e5", "#db2777", "#c8ff00", "#06b6d4"];

/** Starting positions — spread across the viewport */
const PROJECT_POSITIONS: [number, number, number][] = [
  [-4, 4, 0],
  [4, 5, -1],
  [-2, 7, 1],
  [3, 3, 0.5],
];

export function PhysicsPlayground() {
  const [capturedProject, setCapturedProject] = useState<Project | null>(null);

  const handleCapture = useCallback((project: Project) => {
    // Prevent re-capture while modal is showing
    setCapturedProject((current) => {
      if (current) return current;
      return project;
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setCapturedProject(null);
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas
        shadows
        camera={{ position: [0, 0, 18], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#050505"]} />
        <fog attach="fog" args={["#050505", 30, 90]} />

        {/* Ambient fill — very subtle so glass materials catch reflections */}
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[8, 12, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {/* Dark environment for glass reflections */}
        <Environment preset="night" />

        {/* Stars — outside physics, pure visual */}
        <Starfield />

        <Suspense fallback={null}>
          <Physics
            gravity={[0, -1.5, 0]}
            timeStep="vary"
          >
            {/* === Invisible containment walls === */}
            {/* Floor */}
            <CuboidCollider
              position={[0, -10, 0]}
              args={[20, 0.5, 10]}
              restitution={0.8}
              friction={0.1}
            />
            {/* Ceiling */}
            <CuboidCollider
              position={[0, 12, 0]}
              args={[20, 0.5, 10]}
              restitution={0.8}
              friction={0.1}
            />
            {/* Left wall */}
            <CuboidCollider
              position={[-12, 0, 0]}
              args={[0.5, 20, 10]}
              restitution={0.8}
              friction={0.1}
            />
            {/* Right wall */}
            <CuboidCollider
              position={[12, 0, 0]}
              args={[0.5, 20, 10]}
              restitution={0.8}
              friction={0.1}
            />
            {/* Back wall */}
            <CuboidCollider
              position={[0, 0, -5]}
              args={[20, 20, 0.5]}
              restitution={0.8}
              friction={0.1}
            />
            {/* Front wall (near camera) */}
            <CuboidCollider
              position={[0, 0, 5]}
              args={[20, 20, 0.5]}
              restitution={0.8}
              friction={0.1}
            />

            {/* === Project objects === */}
            {projects.map((project, i) => (
              <ProjectNode
                key={project.id}
                project={project}
                position={
                  PROJECT_POSITIONS[i % PROJECT_POSITIONS.length]
                }
                color={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                onCaptured={handleCapture}
              />
            ))}

            {/* === The Black Hole attractor === */}
            <BlackHole
              position={[0, -7, 0]}
              onCapture={handleCapture}
              gravity={12}
              eventHorizonRadius={2.2}
            />
          </Physics>
        </Suspense>

        <Preload all />
      </Canvas>

      {/* === UI Overlay === */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top bar — branding + instructions */}
        <div className="flex justify-between items-start p-8">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tighter">
              ACTION<span className="text-accent">.</span>
            </h1>
            <p className="text-muted text-xs tracking-widest uppercase mt-1 font-mono">
              Digital Agency
            </p>
          </div>

          <div className="text-right">
            <p className="text-muted text-sm font-mono">
              Drag & throw projects into the void
            </p>
            <p className="text-muted/50 text-xs font-mono mt-1">
              The black hole captures them
            </p>
          </div>
        </div>

        {/* Bottom bar — subtle CTA */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <a
            href="/contact"
            className="pointer-events-auto px-6 py-2 border border-border rounded-full text-xs text-muted uppercase tracking-[0.2em] font-mono hover:border-accent hover:text-accent transition-colors duration-500"
          >
            Let&apos;s talk
          </a>
        </div>
      </div>

      {/* === Project Modal (DOM overlay) === */}
      {capturedProject && (
        <ProjectModal
          project={capturedProject}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
