"use client";

import { useEffect, useRef, useState } from "react";
import {
  HOP_HEIGHT,
  INTRO_SESSION_KEY,
  MOBILE_TIMING_MAX_WIDTH,
  bodyPath,
  buildPlan,
  displayPercent,
  effortPath,
  exitAt,
  finalProgress,
  mascotPose,
  progressAt,
} from "@/lib/push-intro";
import styles from "./PushIntro.module.css";

interface PushIntroProps {
  /** Lo de debajo ya puede verse (escena 3D montada y compilada). */
  ready: boolean;
  /** Fin del empuje, 0,6 s antes de que baje el panel: arrancar lo de debajo. */
  onReveal: () => void;
  /** Panel fuera: el padre lo desmonta. */
  onComplete: () => void;
  /** Rótulo del porcentaje para lectores de pantalla. */
  statusLabel: string;
}

/** Si `ready` tarda, el empuje arranca igual y se queda apretando en el 60 %. */
const READY_GRACE_MS = 800;
/**
 * Escotilla (la misma que tenía la persiana de carga): si `ready` no llega
 * nunca (WebGL roto, física que no baja), la intro termina igual y la web
 * queda utilizable.
 */
const STALL_TIMEOUT_MS = 25_000;
/** Al soltarse tras una espera, el temblor se apaga en este tiempo (s). */
const WAIT_FADE = 0.25;
/** Con `prefers-reduced-motion`: sin empuje, fundido corto. */
const REDUCED_FADE_MS = 300;

/** Ojos y brillos de la mascota (`Marca/mascota-favicon/mascota-master.svg`, radio 1). */
const EYES = [
  { x: -0.195, cx: -0.1125, shineX: -0.08, side: 1 },
  { x: 0.15, cx: 0.2325, shineX: 0.265, side: -1 },
] as const;
const EYE_W = 0.165;
const EYE_H = 0.33;
const EYE_Y = -0.83;
const EYE_CY = EYE_Y + EYE_H / 2;
const SHINE_Y = -0.745;
const SHINE_R = 0.0375;

/** Gota de sudor (punta arriba), a escala. */
const DROP_PATH =
  "M0 -0.14 C0.05 -0.063 0.084 -0.014 0.084 0.035 A0.084 0.084 0 0 1 -0.084 0.035 C-0.084 -0.014 -0.05 -0.063 0 -0.14 Z";

type Stage = "waiting" | "pushing" | "exiting";

/**
 * Intro «empuje» de la home (réplica de huyml.co con la mascota; ver
 * `docs/intro-empuje/ANALISIS.md` y `lib/push-intro.ts`).
 *
 * Una pared de tinta tapa la pantalla desde el primer paint (SSR incluido).
 * La mascota la empuja hacia la derecha botando —dos pausas apretando—,
 * detrás queda el panel claro con «ActionDev», y el panel baja como una
 * persiana dejando el rótulo quieto hasta descubrir la escena.
 *
 * Hace de pantalla de carga: si la escena no está lista al llegar a la
 * pausa del 60 %, la mascota se queda ahí apretando (tiembla y suda) hasta
 * que lo esté.
 *
 * Sin GSAP a propósito: pelea con la reconciliación de React cuando los dos
 * tocan el mismo nodo (la antigua pantalla de carga lo sufrió: contador
 * clavado, barra que se reiniciaba). Un único bucle rAF escribe variables
 * CSS en la raíz y atributos del SVG que React no pinta; React solo pone la
 * estructura y tres cambios de estado. Las curvas son las de GSAP, escritas
 * a mano en `lib/push-intro.ts`.
 */
export function PushIntro({ ready, onReveal, onComplete, statusLabel }: PushIntroProps) {
  const [stage, setStage] = useState<Stage>("waiting");
  const [percent, setPercent] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const hopRef = useRef<SVGGElement>(null);
  const squashRef = useRef<SVGGElement>(null);
  const flatRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const eyeRefs = useRef<(SVGRectElement | null)[]>([]);
  const shineRef = useRef<SVGGElement>(null);
  const effortRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const dropRef = useRef<SVGPathElement>(null);

  const readyRef = useRef(ready);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const root = rootRef.current;
    const mascot = mascotRef.current;
    if (!root || !mascot) return;
    // JS al mando: fuera la escotilla CSS (ver `.root` en el módulo).
    root.dataset.armed = "";

    const mountedAt = performance.now();
    const isReady = (now: number) => readyRef.current || now - mountedAt > STALL_TIMEOUT_MS;
    let cancelled = false;
    let raf = 0;
    let timer = 0;

    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      } catch {
        // Sin storage (modo privado estricto): la intro se repetirá, nada más.
      }
      onCompleteRef.current();
    };

    // ── Movimiento reducido: la pared aguanta hasta que todo esté listo y se funde.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const poll = () => {
        if (cancelled) return;
        if (!isReady(performance.now())) {
          raf = requestAnimationFrame(poll);
          return;
        }
        root.dataset.reduced = "";
        onRevealRef.current();
        setStage("exiting");
        timer = window.setTimeout(finish, REDUCED_FADE_MS);
      };
      raf = requestAnimationFrame(poll);
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        window.clearTimeout(timer);
      };
    }

    const run = () => {
      const width = root.clientWidth;
      const diameter = mascot.offsetWidth / 1.3;
      const timing = window.innerWidth <= MOBILE_TIMING_MAX_WIDTH ? "mobile" : "pc";
      const final = finalProgress(timing, diameter, width);
      const plan = buildPlan(timing, final);
      root.style.setProperty("--w", `${width}px`);

      let t = 0;
      let stall = 0;
      let wait = 0;
      let last = performance.now();
      let revealed = false;
      let exiting = false;
      let shownPercent = 0;
      setStage("pushing");

      const tick = (now: number) => {
        if (cancelled) return;
        // Pestaña oculta / hilo ocupado: no saltarse media animación de golpe.
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
        last = now;

        let next = t + dt;
        if (!isReady(now) && next > plan.gate) {
          stall += next - Math.max(t, plan.gate);
          next = plan.gate;
          wait = Math.min(1, stall / 0.3);
        } else if (wait > 0 && t >= plan.gate) {
          wait = Math.max(0, wait - dt / WAIT_FADE);
        }
        t = next;

        const p = progressAt(plan, t);
        root.style.setProperty("--p", p.toFixed(5));
        root.style.setProperty("--pw", Math.min(p, plan.wallMax).toFixed(5));
        root.style.setProperty("--exit", exitAt(plan, t).toFixed(5));
        paintMascot(p, stall, wait);

        const pct = Math.round(displayPercent(p, final) / 10) * 10;
        if (pct !== shownPercent) {
          shownPercent = pct;
          setPercent(pct);
        }
        if (!revealed && t >= plan.reveal) {
          revealed = true;
          onRevealRef.current();
        }
        if (!exiting && t >= plan.exitStart) {
          exiting = true;
          setStage("exiting");
        }
        if (t >= plan.end) {
          finish();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const paintMascot = (p: number, stall: number, wait: number) => {
      const pose = mascotPose(p, stall, wait);
      const n = (v: number) => v.toFixed(4);
      hopRef.current?.setAttribute("transform", `translate(${n(pose.x)} ${n(-pose.hop * HOP_HEIGHT)})`);
      squashRef.current?.setAttribute("transform", `translate(1 1) scale(${n(pose.sx)} ${n(pose.sy)}) translate(-1 -1)`);
      flatRef.current?.setAttribute("transform", `translate(${n(pose.flat)} 0)`);
      bodyRef.current?.setAttribute("d", bodyPath(pose.flat));
      eyeRefs.current.forEach((eye, i) => {
        const { cx, side } = EYES[i];
        eye?.setAttribute(
          "transform",
          `translate(${cx} ${EYE_CY}) rotate(${n(side * pose.eyeTilt)}) scale(1 ${n(pose.eyeOpen)}) translate(${-cx} ${-EYE_CY})`,
        );
      });
      shineRef.current?.setAttribute("opacity", n(pose.shine));
      effortRef.current?.setAttribute("d", effortPath(pose.effort));
      effortRef.current?.setAttribute("opacity", n(pose.effort));
      const shadow = shadowRef.current;
      if (shadow) {
        shadow.setAttribute("cx", n(1 + pose.sx * (pose.flat - 1) + pose.x));
        shadow.setAttribute("rx", n(0.8 * pose.shadow * pose.sx));
        shadow.setAttribute("ry", n(0.07 * pose.shadow));
        shadow.setAttribute("opacity", n(0.16 * pose.shadow));
      }
      const d = pose.drop;
      dropRef.current?.setAttribute("transform", `translate(${n(d.x)} ${n(d.y)}) rotate(${n(d.rot)}) scale(${n(d.scale)})`);
      dropRef.current?.setAttribute("opacity", n(d.opacity));
    };

    paintMascot(0, 0, 0);

    // Arranca con la tipografía puesta (el rótulo no puede cambiar de fuente a
    // medio barrido) y con la escena lista o, si tarda, a los `READY_GRACE_MS`.
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void fonts.then(() => {
      const start = () => {
        if (cancelled) return;
        if (!readyRef.current && performance.now() - mountedAt < READY_GRACE_MS) {
          raf = requestAnimationFrame(start);
          return;
        }
        // Dos frames: el primero con la pared pintada, el siguiente ya empuja.
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(run);
        });
      };
      start();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root} data-testid="push-intro" data-state={stage}>
      <div aria-hidden className={styles.panel} />
      <div aria-hidden className={styles.word}>
        <p className={styles.wordText}>ActionDev</p>
      </div>
      <div aria-hidden className={styles.wall} />
      <div ref={mascotRef} aria-hidden className={styles.mascot}>
        <svg className={styles.mascotSvg} viewBox="-1.6 -1.75 2.6 2.9" focusable="false">
          <ellipse ref={shadowRef} className={styles.ink} cx="0" cy="1.03" rx="0.8" ry="0.07" opacity="0.16" />
          <g ref={hopRef}>
            <g ref={squashRef}>
              <g ref={flatRef}>
                <path ref={bodyRef} className={styles.body} d={bodyPath(0)} />
                {EYES.map((eye, i) => (
                  <rect
                    key={eye.cx}
                    ref={(el) => {
                      eyeRefs.current[i] = el;
                    }}
                    className={styles.ink}
                    x={eye.x}
                    y={EYE_Y}
                    width={EYE_W}
                    height={EYE_H}
                    rx={EYE_W / 2}
                  />
                ))}
                <g ref={shineRef} className={styles.shine}>
                  {EYES.map((eye) => (
                    <circle key={eye.shineX} cx={eye.shineX} cy={SHINE_Y} r={SHINE_R} />
                  ))}
                </g>
              </g>
            </g>
            <path ref={effortRef} className={styles.effort} d={effortPath(0)} opacity="0" />
          </g>
          <path ref={dropRef} className={styles.ink} d={DROP_PATH} opacity="0" />
        </svg>
      </div>
      <span className={styles.status} aria-live="polite" aria-label={statusLabel}>
        {percent}%
      </span>
    </div>
  );
}
