"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { playHitSfx, playShotSfx } from "@/lib/hero-sfx";
import { bulletSpeed, type GullTarget } from "./gull-hunt-logic";

/**
 * Easter egg: la bala, el fogonazo y las plumas de la caza de gaviotas.
 *
 * `fire(target)` sale desde abajo, a la derecha del mando (la "otra mano"
 * del visitante: un punto a 4 u de la cámara proyectado en la esquina
 * inferior), y PERSIGUE a la gaviota — su posición se lee cada frame, así
 * nunca falla aunque el ave siga volando. Al llegar: `target.shoot()`,
 * sonido de impacto y nube de plumas.
 *
 * Todo son pools de mallas mutadas en `useFrame`: cero allocations por
 * disparo, cero re-renders. Estética de la escena: colores planos + contorno
 * de tinta (una copia en negro `BackSide` un poco mayor).
 */

export interface GullHuntHandle {
  fire: (target: GullTarget) => void;
}

interface GullHuntProps {
  /** Se llama al abatir una gaviota (el contador lo escucha). */
  onHit?: (target: GullTarget) => void;
  outline: string;
}

const BULLETS = 4;
const FEATHERS = 24;
const FEATHER_LIFE = 1.3;
const FLASH_LIFE = 0.11;
const POOF_LIFE = 0.42;
const ACCENT = "#c8ff00";
const FLASH = "#fff2a8";

/** Origen del disparo en NDC: abajo, justo a la derecha del mando. */
const HAND_NDC = new THREE.Vector3(0.19, -0.9, 0.5);
const HAND_DEPTH = 4;

interface Bullet {
  active: boolean;
  target: GullTarget | null;
  speed: number;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
}

interface Feather {
  life: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  scale: number;
}

/** Estrella de 8 puntas del fogonazo de cómic. */
function starShape(outer: number, inner: number, points = 8) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

const _v = new THREE.Vector3();
const _aim = new THREE.Vector3();

export const GullHunt = forwardRef<GullHuntHandle, GullHuntProps>(function GullHunt({ onHit, outline }, ref) {
  const { camera } = useThree();

  const bulletMeshes = useRef<(THREE.Group | null)[]>([]);
  const featherMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const flash = useRef<THREE.Group>(null);
  const poof = useRef<THREE.Mesh>(null);

  const bullets = useRef<Bullet[]>(
    Array.from({ length: BULLETS }, () => ({
      active: false, target: null, speed: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(),
    })),
  );
  const feathers = useRef<Feather[]>(
    Array.from({ length: FEATHERS }, () => ({
      life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: new THREE.Vector3(), scale: 1,
    })),
  );
  const flashT = useRef(FLASH_LIFE);
  const poofT = useRef(POOF_LIFE);
  const poofSize = useRef(1);
  const nextFeather = useRef(0);

  const geo = useMemo(() => ({
    star: new THREE.ShapeGeometry(starShape(0.26, 0.1)),
    starInk: new THREE.ShapeGeometry(starShape(0.31, 0.14)),
    feather: new THREE.PlaneGeometry(0.24, 0.12),
  }), []);

  const burst = (x: number, y: number, z: number, size: number) => {
    for (let n = 0; n < 12; n++) {
      const f = feathers.current[nextFeather.current];
      nextFeather.current = (nextFeather.current + 1) % FEATHERS;
      const a = Math.random() * Math.PI * 2;
      const b = (Math.random() - 0.5) * Math.PI;
      const sp = 1.8 + Math.random() * 3.2;
      f.life = FEATHER_LIFE;
      f.pos.set(x, y, z);
      f.vel.set(Math.cos(a) * Math.cos(b) * sp, Math.sin(b) * sp + 1.5, Math.sin(a) * Math.cos(b) * sp);
      f.spin.set(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4);
      f.scale = size * (0.7 + Math.random() * 0.6);
    }
    if (poof.current) {
      poof.current.position.set(x, y, z);
      poofSize.current = size;
      poofT.current = 0;
    }
  };

  useImperativeHandle(ref, () => ({
    fire(target) {
      const b = bullets.current.find((bb) => !bb.active) ?? bullets.current[0];
      // Origen: la "otra mano", a HAND_DEPTH u de la cámara hacia la esquina inferior.
      _v.copy(HAND_NDC).unproject(camera).sub(camera.position).normalize();
      b.pos.copy(camera.position).addScaledVector(_v, HAND_DEPTH);
      _aim.set(target.x, target.y, target.z);
      b.speed = bulletSpeed(_aim.distanceTo(b.pos));
      b.dir.copy(_aim).sub(b.pos).normalize();
      b.target = target;
      b.active = true;
      if (flash.current) {
        flash.current.position.copy(b.pos).addScaledVector(b.dir, 0.35);
        flash.current.lookAt(camera.position);
        flash.current.rotation.z = Math.random() * Math.PI;
        flashT.current = 0;
      }
      playShotSfx();
    },
  }), [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);

    // --- Balas: persiguen a su gaviota; impacto al quedar a un radio.
    bullets.current.forEach((b, i) => {
      const g = bulletMeshes.current[i];
      if (!g) return;
      if (!b.active || !b.target) { g.visible = false; return; }
      const tg = b.target;
      _aim.set(tg.x, tg.y, tg.z);
      const dist = _aim.distanceTo(b.pos);
      const step = b.speed * dt;
      if (!tg.alive || dist <= Math.max(step, tg.radius * 0.6)) {
        b.active = false;
        g.visible = false;
        if (tg.alive) {
          tg.shoot();
          burst(tg.x, tg.y, tg.z, tg.radius / 0.75);
          playHitSfx();
          onHit?.(tg);
        }
        return;
      }
      // Giro suave hacia el blanco: recta a ojo, pero nunca falla.
      _v.copy(_aim).sub(b.pos).normalize();
      b.dir.lerp(_v, Math.min(1, dt * 14)).normalize();
      b.pos.addScaledVector(b.dir, step);
      g.visible = true;
      g.position.copy(b.pos);
      g.lookAt(_aim);
    });

    // --- Fogonazo: crece de golpe y se apaga.
    if (flash.current) {
      flashT.current += dt;
      const k = flashT.current / FLASH_LIFE;
      flash.current.visible = k < 1;
      if (k < 1) flash.current.scale.setScalar(0.5 + 0.9 * Math.sin(k * Math.PI));
    }

    // --- Nube blanca del impacto.
    if (poof.current) {
      poofT.current += dt;
      const k = poofT.current / POOF_LIFE;
      poof.current.visible = k < 1;
      if (k < 1) {
        (poof.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k * k);
        poof.current.scale.setScalar(poofSize.current * (0.6 + 1.6 * k));
      }
    }

    // --- Plumas: caen con resistencia, giran y se desvanecen al final.
    feathers.current.forEach((f, i) => {
      const m = featherMeshes.current[i];
      if (!m) return;
      if (f.life <= 0) { m.visible = false; return; }
      f.life -= dt;
      f.vel.y -= 3.2 * dt;
      f.vel.multiplyScalar(1 - dt * 1.6);
      f.pos.addScaledVector(f.vel, dt);
      m.visible = true;
      m.position.copy(f.pos);
      m.rotation.x += f.spin.x * dt;
      m.rotation.y += f.spin.y * dt;
      m.rotation.z += f.spin.z * dt;
      m.scale.setScalar(f.scale);
      const k = f.life / FEATHER_LIFE;
      (m.material as THREE.MeshBasicMaterial).opacity = k < 0.4 ? k / 0.4 : 1;
    });
  });

  return (
    <group>
      {bullets.current.map((_, i) => (
        <group key={i} ref={(el) => { bulletMeshes.current[i] = el; }} visible={false}>
          {/* Cuerpo de la bala a lo largo de +z (hacia donde mira el grupo). */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.5, 3, 8]} />
            <meshBasicMaterial color={ACCENT} toneMapped={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.1, 0.52, 3, 8]} />
            <meshBasicMaterial color={outline} side={THREE.BackSide} toneMapped={false} />
          </mesh>
          {/* Estela: se queda atrás y se apaga hacia la cola. */}
          <mesh position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.04, 0.7, 2, 6]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0.45} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}

      <group ref={flash} visible={false}>
        <mesh geometry={geo.starInk} position={[0, 0, -0.01]}>
          <meshBasicMaterial color={outline} toneMapped={false} />
        </mesh>
        <mesh geometry={geo.star}>
          <meshBasicMaterial color={FLASH} toneMapped={false} />
        </mesh>
        <mesh geometry={geo.star} scale={0.45} position={[0, 0, 0.01]}>
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
      </group>

      <mesh ref={poof} visible={false}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} toneMapped={false} depthWrite={false} />
      </mesh>

      {feathers.current.map((_, i) => (
        <mesh key={i} ref={(el) => { featherMeshes.current[i] = el; }} geometry={geo.feather} visible={false}>
          <meshBasicMaterial
            color={i % 3 === 0 ? "#aab3c2" : "#f7f5ee"}
            side={THREE.DoubleSide}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});
