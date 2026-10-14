"use client";

import { useEffect, useRef, useState } from "react";
import {
  DOT_GROW,
  INTRO_SESSION_KEY,
  MOBILE_TIMING_MAX_WIDTH,
  type ArrivalGeometry,
  type MascotPose,
  arrivalPose,
  bodyPath,
  buildPlan,
  displayPercent,
  exitAt,
  finalProgress,
  impactPath,
  mascotPose,
  progressAt,
  speedPath,
  veinPath,
  wallAt,
} from "@/lib/push-intro";
import { LOGO_D, LOGO_DOT, LOGO_TRANSFORM, LOGO_VIEWBOX } from "./intro-logo";
import styles from "./PushIntro.module.css";

interface PushIntroProps {
  /** Lo de debajo ya puede verse (escena 3D montada y compilada). */
  ready: boolean;
  /**
   * Lo de debajo ya pasó su arranque más pesado (crear el contexto WebGL
   * bloquea el hilo ~0,7 s en la primera visita). Hasta entonces la pared se
   * queda quieta: ese bloqueo en pleno salto se ve como un tirón.
   */
  booted?: boolean;
  /** Fin del empuje, 0,6 s antes del fundido: arrancar lo de debajo. */
  onReveal: () => void;
  /** Fundido acabado: el padre lo desmonta. */
  onComplete: () => void;
  /** Rótulo del porcentaje para lectores de pantalla. */
  statusLabel: string;
}

/** Si `ready` tarda, el empuje arranca igual (con `booted`) y se queda apretando en el 60 %. */
const READY_GRACE_MS = 800;
/** Si ni siquiera llega `booted` (red lenta, WebGL roto), arranca igual a los 3 s. */
const BOOT_GRACE_MS = 3000;
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

/** Solo hay una intro a la vez: id fijo (el de `useId` no vale dentro de `url(#…)`). */
const RELIEF_ID = "push-intro-relief";
/** Canto del relieve: la silueta repetida hacia abajo a la derecha (unidades del viewBox del logo, ~0,74 px). */
const EXTRUDE_STEPS = 9;
const EXTRUDE_STEP = { x: 0.9, y: 1.3 } as const;

/**
 * Relieve del logo, todo en un filtro SVG (sin capas ni copias del trazado):
 * sombra suave sobre el cristal, canto gris oscuro hacia abajo a la derecha y
 * la cara en tinta con un bisel iluminado desde arriba a la izquierda. El
 * logo no se mueve, así que el navegador lo calcula una vez.
 */
function LogoRelief() {
  const steps = Array.from({ length: EXTRUDE_STEPS }, (_, i) => i + 1);
  return (
    <filter
      id={RELIEF_ID}
      x="-4%"
      y="-8%"
      width="112%"
      height="130%"
      colorInterpolationFilters="sRGB"
    >
      <feFlood floodColor="#000" floodOpacity="0.32" result="shadowInk" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blurred" />
      <feOffset in="blurred" dx="10" dy="18" result="shadowShape" />
      <feComposite in="shadowInk" in2="shadowShape" operator="in" result="shadow" />

      <feFlood floodColor="#3a3935" result="sideInk" />
      <feComposite in="sideInk" in2="SourceAlpha" operator="in" result="sideShape" />
      {steps.map((i) => (
        <feOffset
          key={i}
          in="sideShape"
          dx={EXTRUDE_STEP.x * i}
          dy={EXTRUDE_STEP.y * i}
          result={`side${i}`}
        />
      ))}

      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="bump" />
      <feSpecularLighting
        in="bump"
        surfaceScale="5"
        specularConstant="0.85"
        specularExponent="16"
        lightingColor="#fff"
        result="spec"
      >
        <feDistantLight azimuth="225" elevation="40" />
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specFace" />
      <feComposite in="SourceGraphic" in2="specFace" operator="arithmetic" k2="1" k3="0.45" result="face" />

      <feMerge>
        <feMergeNode in="shadow" />
        {[...steps].reverse().map((i) => (
          <feMergeNode key={i} in={`side${i}`} />
        ))}
        <feMergeNode in="face" />
      </feMerge>
    </filter>
  );
}

/**
 * Intro «empuje» de la home (réplica de huyml.co con la mascota; ver
 * `docs/intro-empuje/ANALISIS.md` y `lib/push-intro.ts`).
 *
 * Una pared de tinta tapa la pantalla desde el primer paint (SSR incluido).
 * La mascota la empuja a embestidas: rebota hacia atrás en parábola (con
 * mortal en saltos alternos), coge carrerilla y se estampa —dos pausas
 * apretando—, la pared avanza a golpes y detrás queda un cristal translúcido
 * (la web difuminada) con el logo en relieve, sin su punto final. Con la
 * pared fuera, la mascota vuelve de un salto, aterriza en ese hueco y guiña.
 * Todo se funde y queda la escena.
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
export function PushIntro({ ready, booted = true, onReveal, onComplete, statusLabel }: PushIntroProps) {
  const [stage, setStage] = useState<Stage>("waiting");
  const [percent, setPercent] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const scaleRef = useRef<SVGGElement>(null);
  const shineDotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const posRef = useRef<SVGGElement>(null);
  const squashRef = useRef<SVGGElement>(null);
  const flatRef = useRef<SVGGElement>(null);
  const spinRef = useRef<SVGGElement>(null);
  const impactRef = useRef<SVGPathElement>(null);
  const speedRef = useRef<SVGPathElement>(null);
  const dustRefs = useRef<(SVGCircleElement | null)[]>([]);
  const bodyRef = useRef<SVGPathElement>(null);
  const eyeRefs = useRef<(SVGRectElement | null)[]>([]);
  const shineRef = useRef<SVGGElement>(null);
  const veinRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const dropRef = useRef<SVGPathElement>(null);

  const readyRef = useRef(ready);
  const bootedRef = useRef(booted);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    bootedRef.current = booted;
  }, [booted]);
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
      const diameter = mascot.offsetWidth / 3;
      const timing = window.innerWidth <= MOBILE_TIMING_MAX_WIDTH ? "mobile" : "pc";
      const final = finalProgress(timing, diameter, width);
      const plan = buildPlan(timing, final);
      root.style.setProperty("--w", `${width}px`);
      const height = root.clientHeight;
      const arrival = arrivalGeometry(width, height, diameter / 2, wallAt(final));

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
        const wall = wallAt(p);
        root.style.setProperty("--mw", wall.toFixed(5));
        root.style.setProperty("--pw", Math.min(wall, plan.wallMax).toFixed(5));
        root.style.setProperty("--exit", exitAt(plan, t).toFixed(5));
        const shake =
          t < plan.pushEnd
            ? paintMascot(mascotPose(p, stall, wait))
            : paintMascot(arrivalPose(t - plan.pushEnd, arrival));
        root.style.setProperty("--shake", `${(shake * diameter) / 2}px`);

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

    /**
     * Dónde aterriza la mascota: el hueco del punto final del logo, con su
     * borde izquierdo y su base, a `DOT_GROW` veces su tamaño. Todo en radios
     * desde el sitio de reposo (pegada a la pared en `wall`, a media altura).
     */
    const arrivalGeometry = (width: number, height: number, r: number, wall: number): ArrivalGeometry => {
      const restX = wall * width - r;
      const restY = height / 2;
      const origin = root.getBoundingClientRect();
      const logo = logoRef.current?.getBoundingClientRect();
      const k = logo ? logo.width / LOGO_VIEWBOX.w : 0;
      const dotR = (LOGO_DOT.size * DOT_GROW * k) / 2 || r * 0.2;
      const tx = logo ? logo.left - origin.left + LOGO_DOT.left * k + dotR : width / 2;
      const ty = logo ? logo.top - origin.top + LOGO_DOT.bottom * k - dotR : restY;
      return {
        from: { x: (width + r * 1.2 - restX) / r, y: 0 },
        to: { x: (tx - restX) / r, y: (restY - ty) / r },
        scale: dotR / r,
        lift: (0.3 * height) / r,
      };
    };

    /** Pinta la pose y devuelve la sacudida (en radios) para la raíz. */
    const paintMascot = (pose: MascotPose) => {
      const n = (v: number) => v.toFixed(4);
      const a = n(pose.anchor);
      posRef.current?.setAttribute("transform", `translate(${n(pose.x)} ${n(-pose.y)})`);
      scaleRef.current?.setAttribute("transform", `scale(${n(pose.scale)})`);
      squashRef.current?.setAttribute(
        "transform",
        `translate(${a} 1) scale(${n(pose.sx)} ${n(pose.sy)}) translate(-${a} -1)`,
      );
      flatRef.current?.setAttribute("transform", `translate(${n(pose.flat)} 0)`);
      spinRef.current?.setAttribute("transform", `rotate(${n(pose.rot)})`);
      bodyRef.current?.setAttribute("d", bodyPath(pose.flat));
      eyeRefs.current.forEach((eye, i) => {
        const { cx, side } = EYES[i];
        // Guiña el ojo derecho (el segundo): se cierra en una raya.
        const open = i === 1 ? pose.eyeOpen * (1 - 0.86 * pose.wink) : pose.eyeOpen;
        eye?.setAttribute(
          "transform",
          `translate(${cx} ${EYE_CY}) rotate(${n(side * pose.eyeTilt)}) scale(1 ${n(open)}) translate(${-cx} ${-EYE_CY})`,
        );
      });
      shineRef.current?.setAttribute("opacity", n(pose.shine));
      shineDotRefs.current[1]?.setAttribute("opacity", n(1 - pose.wink));
      veinRef.current?.setAttribute("d", veinPath(pose.vein));
      veinRef.current?.setAttribute("opacity", n(Math.min(1, pose.vein)));
      impactRef.current?.setAttribute("d", impactPath(pose.impact));
      speedRef.current?.setAttribute("d", speedPath(pose.speed, pose.x));
      speedRef.current?.setAttribute("opacity", n(pose.speed));
      dustRefs.current.forEach((puff, i) => {
        if (!puff) return;
        const d = pose.dust;
        if (!d) {
          puff.setAttribute("opacity", "0");
          return;
        }
        const spread = (i - 1) * (0.5 + 0.9 * d.age);
        puff.setAttribute("cx", n(d.x + spread));
        puff.setAttribute("cy", n(0.92 - 0.25 * d.age * (i === 1 ? 1.4 : 1)));
        puff.setAttribute("r", n(0.14 + 0.3 * d.age));
        puff.setAttribute("opacity", n(0.32 * (1 - d.age)));
      });
      const shadow = shadowRef.current;
      if (shadow) {
        shadow.setAttribute("cx", n(pose.x));
        shadow.setAttribute("rx", n(0.85 * pose.shadow * pose.sx));
        shadow.setAttribute("ry", n(0.08 * pose.shadow));
        shadow.setAttribute("opacity", n(0.16 * pose.shadow));
      }
      const d = pose.drop;
      dropRef.current?.setAttribute(
        "transform",
        `translate(${n(d.x)} ${n(d.y)}) rotate(${n(d.rot)}) scale(${n(d.scale)})`,
      );
      dropRef.current?.setAttribute("opacity", n(d.opacity));
      return pose.shake;
    };

    paintMascot(mascotPose(0));

    // Arranca con las fuentes puestas y con la escena lista o, si tarda, a los
    // `READY_GRACE_MS` con su contexto WebGL ya creado (`BOOT_GRACE_MS` como tope).
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void fonts.then(() => {
      const start = () => {
        if (cancelled) return;
        const waited = performance.now() - mountedAt;
        const canStart =
          readyRef.current || (bootedRef.current && waited >= READY_GRACE_MS) || waited >= BOOT_GRACE_MS;
        if (!canStart) {
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
        <svg
          ref={logoRef}
          className={styles.logo}
          viewBox={`0 0 ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`}
          focusable="false"
          data-testid="push-intro-logo"
        >
          <defs>
            <LogoRelief />
          </defs>
          <g filter={`url(#${RELIEF_ID})`}>
            <path transform={LOGO_TRANSFORM} d={LOGO_D} />
          </g>
        </svg>
      </div>
      <div aria-hidden className={styles.wall} />
      <div ref={mascotRef} aria-hidden className={styles.mascot}>
        <svg className={styles.mascotSvg} viewBox="-5 -3.8 6 5.3" focusable="false">
          <ellipse ref={shadowRef} className={styles.ink} cx="0" cy="1.03" rx="0.85" ry="0.08" opacity="0.16" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              ref={(el) => {
                dustRefs.current[i] = el;
              }}
              className={styles.ink}
              cx="0"
              cy="0.92"
              r="0"
              opacity="0"
            />
          ))}
          <path ref={speedRef} className={styles.lines} d="" opacity="0" />
          <path ref={impactRef} className={styles.impact} d="" />
          <g ref={posRef}>
            <g ref={scaleRef}>
              <g ref={squashRef}>
                <g ref={flatRef}>
                  <g ref={spinRef}>
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
                      {EYES.map((eye, i) => (
                        <circle
                          key={eye.shineX}
                          ref={(el) => {
                            shineDotRefs.current[i] = el;
                          }}
                          cx={eye.shineX}
                          cy={SHINE_Y}
                          r={SHINE_R}
                        />
                      ))}
                    </g>
                    <path ref={veinRef} className={styles.vein} d="" opacity="0" />
                  </g>
                </g>
              </g>
            </g>
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
