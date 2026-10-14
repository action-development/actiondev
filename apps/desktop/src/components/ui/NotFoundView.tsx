"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { HoloButton } from "@/components/ui/HoloButton";
import { LegalLinks } from "@/components/layout/LegalLinks";
import {
  DROP_DURATION,
  EYES,
  EYE_CY,
  EYE_H,
  EYE_W,
  EYE_Y,
  FOUR_D,
  GAZE,
  HOP_DURATION,
  MASCOT_CX,
  MASCOT_CY,
  MASCOT_R,
  NUMERAL_VIEWBOX,
  QUESTION_D,
  REST,
  SECOND_FOUR_X,
  SHINE_R,
  SHINE_Y,
  ZERO_D,
  ZERO_X,
  approach,
  blinkOpen,
  dropPose,
  fourJolt,
  gazeToward,
  hopPose,
  isFlipHop,
  searchPose,
} from "@/lib/not-found-mascot";
import styles from "./NotFoundView.module.css";

/** Sin mover el puntero este rato, la mascota se pone a buscar la página. */
const LOST_AFTER = 2.5;

const LINKS = [
  { href: "/projects", key: "work" },
  { href: "/resenas", key: "reviews" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

const n = (v: number) => v.toFixed(4);

/** Ruta legible: `/servi%C3%A7os` → `/serviços`; si no se puede decodificar, tal cual. */
function readablePath(path: string) {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}

/**
 * Cuerpo del 404 de escritorio: lo pintan `app/(site)/not-found.tsx` y
 * `app/global-not-found.tsx` (cliente por `useT()` y la mascota; los
 * metadatos van en esos dos archivos, que son server components).
 *
 * Un «404» gigante en el que el 0 es la mascota: entra cayendo en el hueco del
 * 0 (los 4 dan un respingo), sigue el puntero con los ojos, parpadea, se pone
 * a buscar la página con un «?» si nadie la mira y salta (y guiña) al
 * pulsarla. Mismo patrón que la intro «empuje»: UN bucle rAF que escribe
 * atributos del SVG, nunca estado de React por frame. Poses y geometría en
 * `lib/not-found-mascot.ts`. `prefers-reduced-motion` = sin caída, saltos ni
 * búsqueda: solo los ojos.
 */
export function NotFoundView() {
  const t = useT();
  const pathname = usePathname();

  const rootRef = useRef<HTMLElement>(null);
  const slotRef = useRef<SVGCircleElement>(null);
  const mascotRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const eyeRefs = useRef<(SVGRectElement | null)[]>([]);
  const shineRefs = useRef<(SVGCircleElement | null)[]>([]);
  const haloRef = useRef<SVGEllipseElement>(null);
  const questionRef = useRef<SVGGElement>(null);
  const leftFourRef = useRef<SVGGElement>(null);
  const rightFourRef = useRef<SVGGElement>(null);
  /** Lo que el bucle lee de los eventos (clic en la mascota, hover del CTA). */
  const hopRef = useRef<(height: number, flipCount: boolean) => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    const slot = slotRef.current;
    if (!root || !slot) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = () => performance.now() / 1000;
    const start = now();

    const s = {
      gx: 0,
      gy: 0,
      tilt: 0,
      q: 0,
      /** Mirada pedida por el puntero o el foco (null = nadie la mira). */
      target: null as { x: number; y: number } | null,
      lastMove: -Infinity,
      lostSince: start,
      blinkAt: -1,
      nextBlink: start + 1.8,
      hopAt: -1,
      hopHeight: 0,
      hopFlip: false,
      hops: 0,
      winkUntil: -1,
    };

    const lookAt = (x: number, y: number) => {
      const r = slot.getBoundingClientRect();
      if (r.width === 0) return;
      s.target = gazeToward(x - (r.left + r.width / 2), y - (r.top + r.height / 2), r.width / 2);
      s.lastMove = now();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") lookAt(e.clientX, e.clientY);
    };
    const onFocus = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const r = e.target.getBoundingClientRect();
      lookAt(r.left + r.width / 2, r.top + r.height / 2);
    };

    hopRef.current = (height, counts) => {
      const at = now();
      if (reduced || at - start < DROP_DURATION || (s.hopAt >= 0 && at - s.hopAt < HOP_DURATION)) return;
      if (counts) s.hops += 1;
      s.hopAt = at;
      s.hopHeight = height;
      s.hopFlip = counts && isFlipHop(s.hops);
      if (counts) s.winkUntil = at + HOP_DURATION + 0.45;
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    root.addEventListener("focusin", onFocus);
    root.setAttribute("data-armed", "");

    let raf = 0;
    let last = start;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const at = now();
      const dt = Math.min(0.05, at - last);
      last = at;
      const t = at - start;

      // Pose del cuerpo: caída de entrada → salto en curso → reposo.
      let pose = reduced ? REST : dropPose(t);
      if (s.hopAt >= 0) {
        const h = at - s.hopAt;
        if (h < HOP_DURATION) pose = hopPose(h, s.hopHeight, s.hopFlip);
        else s.hopAt = -1;
      }

      // ¿La mira alguien? Si no, busca la página.
      // Cuenta desde que aterriza: no se pone a buscar nada más llegar.
      const lost = at - Math.max(s.lastMove, start + DROP_DURATION) > LOST_AFTER;
      if (!lost) s.lostSince = at;
      let goal = s.target ?? { x: 0, y: GAZE.down * 0.4 };
      let tiltGoal = (goal.x / GAZE.x) * 4;
      if (lost) {
        if (reduced) {
          goal = { x: 0, y: GAZE.down * 0.4 };
          tiltGoal = 0;
        } else {
          const sp = searchPose(at - s.lostSince);
          goal = sp;
          tiltGoal = sp.tilt;
        }
      }
      s.gx = approach(s.gx, goal.x, dt, lost ? 9 : 16);
      s.gy = approach(s.gy, goal.y, dt, lost ? 9 : 16);
      s.tilt = approach(s.tilt, reduced ? 0 : tiltGoal, dt, 6);
      s.q = approach(s.q, lost && !reduced ? 1 : 0, dt, lost ? 5 : 12);

      // Parpadeo a ratos, a veces doble.
      if (at >= s.nextBlink) {
        s.blinkAt = at;
        s.nextBlink = at + (Math.random() < 0.25 ? 0.22 : 2 + Math.random() * 3);
      }
      const open = pose.eyeOpen * blinkOpen(at - s.blinkAt);
      const wink = at < s.winkUntil ? 1 : 0;

      mascotRef.current?.setAttribute(
        "transform",
        `translate(${n(MASCOT_CX + pose.x * MASCOT_R)} ${n(MASCOT_CY + pose.y * MASCOT_R)}) scale(${MASCOT_R}) ` +
          `rotate(${n(pose.rot + s.tilt)}) translate(0 1) scale(${n(pose.sx)} ${n(pose.sy)}) translate(0 -1)`,
      );
      eyesRef.current?.setAttribute("transform", `translate(${n(s.gx)} ${n(s.gy)})`);
      eyeRefs.current.forEach((eye, i) => {
        const o = Math.max(0.06, i === 1 ? open * (1 - 0.86 * wink) : open);
        eye?.setAttribute("transform", `translate(0 ${EYE_CY}) scale(1 ${n(o)}) translate(0 ${-EYE_CY})`);
        shineRefs.current[i]?.setAttribute("opacity", o > 0.6 ? "1" : "0");
      });

      // Halo lima en el suelo: se encoge y se apaga cuanto más alto va.
      const lift = Math.min(1, Math.max(0, -pose.y / 2.5));
      haloRef.current?.setAttribute("rx", n(MASCOT_R * 0.9 * (1 - 0.6 * lift)));
      haloRef.current?.setAttribute("opacity", n(0.14 * (1 - lift)));

      questionRef.current?.setAttribute("opacity", n(s.q));
      questionRef.current?.setAttribute(
        "transform",
        `translate(${n(MASCOT_CX + MASCOT_R * 1.02 + pose.x * MASCOT_R)} ${n(-MASCOT_R * 2.02 + pose.y * MASCOT_R)}) ` +
          `rotate(${n(14 + s.tilt)}) scale(${n(0.3 * (0.6 + 0.4 * s.q))} ${n(-0.3 * (0.6 + 0.4 * s.q))}) translate(-285 -350)`,
      );

      const jolt = reduced ? { y: 0, rot: 0 } : fourJolt(t);
      leftFourRef.current?.setAttribute("transform", `translate(320 ${n(jolt.y)}) rotate(${n(-jolt.rot)}) translate(-320 0)`);
      rightFourRef.current?.setAttribute(
        "transform",
        `translate(${SECOND_FOUR_X + 320} ${n(jolt.y)}) rotate(${n(jolt.rot)}) translate(${-(SECOND_FOUR_X + 320)} 0)`,
      );
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      root.removeEventListener("focusin", onFocus);
      hopRef.current = () => {};
    };
  }, []);

  const linkClass = "link-sweep font-mono text-xs uppercase tracking-[0.18em] text-muted hover:text-accent";

  return (
    <main
      ref={rootRef}
      id="main-content"
      data-testid="not-found"
      className={`${styles.root} relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground`}
    >
      <div className="flex items-center justify-between gap-6 px-6 pt-6 md:px-10 md:pt-8">
        <Link href="/" aria-label={t.nav.brandHome} className="shrink-0">
          <Image src="/logos/logo.webp" alt="" width={100} height={40} priority className="h-8 w-auto invert md:h-9" />
        </Link>
        <p className="micro-label micro-label-accent">{t.notFound.code}</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(2rem,6vh,4rem)] px-6 py-10">
        {/* El número es dibujo: lo que se lee es el <h1>. Glifos de Space
            Grotesk Bold vectorizados, así la bola encaja al píxel en el 0. */}
        <svg className={styles.numeral} viewBox={NUMERAL_VIEWBOX} aria-hidden="true" focusable="false">
          <g ref={leftFourRef} className={styles.four}>
            <path transform="scale(1 -1)" d={FOUR_D} />
          </g>
          <path className={styles.slot} transform={`translate(${ZERO_X} 0) scale(1 -1)`} d={ZERO_D} />
          {/* Referencia fija de dónde está la bola en reposo (para la mirada). */}
          <circle ref={slotRef} cx={MASCOT_CX} cy={MASCOT_CY} r={MASCOT_R} fill="none" />
          <ellipse ref={haloRef} className={styles.halo} cx={MASCOT_CX} cy={20} rx={MASCOT_R * 0.9} ry={26} opacity="0.14" />
          <g ref={rightFourRef} className={styles.four}>
            <path transform={`translate(${SECOND_FOUR_X} 0) scale(1 -1)`} d={FOUR_D} />
          </g>
          <g ref={questionRef} className={styles.question} opacity="0">
            <path d={QUESTION_D} />
          </g>
          <g
            ref={mascotRef}
            className={styles.mascot}
            data-testid="not-found-mascot"
            transform={`translate(${MASCOT_CX} ${MASCOT_CY}) scale(${MASCOT_R})`}
            onPointerDown={() => hopRef.current(0.65, true)}
          >
            <circle className={styles.body} r="1" />
            <g ref={eyesRef}>
              {EYES.map((eye, i) => (
                <rect
                  key={eye.x}
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
              {EYES.map((eye, i) => (
                <circle
                  key={eye.shineX}
                  ref={(el) => {
                    shineRefs.current[i] = el;
                  }}
                  className={styles.shine}
                  cx={eye.shineX}
                  cy={SHINE_Y}
                  r={SHINE_R}
                />
              ))}
            </g>
          </g>
        </svg>

        <div className="flex max-w-[44rem] flex-col items-center gap-5 text-center">
          <h1 className="text-[clamp(2rem,4.2vw,3.5rem)] font-bold uppercase leading-[0.98] tracking-tight">
            {t.notFound.title}
          </h1>
          <p className="lede mx-auto">{t.notFound.subtitle}</p>
          <p className="flex max-w-full flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
            <span className="micro-label">{t.notFound.pathLabel}</span>
            <code className={styles.path}>{readablePath(pathname ?? "/")}</code>
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <span onPointerEnter={() => hopRef.current(0.32, false)} onFocus={() => hopRef.current(0.32, false)}>
            <HoloButton href="/" variant="solid" data-testid="not-found-home">
              {t.notFound.cta}
            </HoloButton>
          </span>
          <nav aria-label={t.notFound.navLabel}>
            <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {t.nav[link.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <LegalLinks
        className="flex justify-center px-6 pb-6 font-mono text-[11px] uppercase tracking-[0.16em]"
        linkClassName="link-sweep uppercase tracking-[0.16em] text-muted hover:text-accent"
      />
    </main>
  );
}
