"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { projects, type Project } from "@actiondev/shared";
import { useI18n } from "@/lib/i18n/context";

const MOBILE_ORDER: string[] = [
  "fase",
  "patricia-avendano",
  "licentia",
  "autoescuela-gti",
  "paris-de-noia",
  "cliche",
  "musa",
  "samoa",
  "almudena-muhle",
  "fang-tours",
  "pbb-porrino",
  "koopey",
  "nabi",
  "true-trading-landing",
  "canelita",
  "cachadas",
  "fisioterapia-noia",
  "cerveceria-equs",
  "roots",
  "ertuned",
  "kairos-futures",
  "true-trading-app",
];

const STACK_PROJECTS: Project[] = MOBILE_ORDER
  .map((id) => projects.find((p) => p.id === id))
  .filter(
    (p): p is Project => !!p && !p.image.endsWith("placeholder.webp")
  );
const STEPS = STACK_PROJECTS.length;
const VISIBLE_LIST_ROWS = 7;
const TRANSITION_MS = 420;
const WHEEL_THRESHOLD = 8;
const TOUCH_THRESHOLD = 30;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface CurrentProps {
  project: Project;
  index: number;
  local: number;
  throwY: number;
  useEs: boolean;
}

function Current({ project, index, local, throwY, useEs }: CurrentProps) {
  const leaveT = local;
  const ty = leaveT * throwY;
  const rowOpacity = 1 - clamp01((leaveT - 0.88) / 0.12);
  const photoOpacity = 1 - clamp01(leaveT * 1.6);

  return (
    <div
      style={{
        transform: `translate3d(0, ${ty}px, 0)`,
        opacity: rowOpacity,
        willChange: "transform, opacity",
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2 border-b border-black/15 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[11px] tracking-wider text-black/40">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
            {useEs ? (project.categoryEs ?? project.category) : project.category}
          </span>
        </div>
        <h3 className="whitespace-nowrap text-[18px] font-bold leading-none tracking-tight text-black">
          {project.title}
        </h3>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-black/10 bg-black/[0.02]"
        style={{ aspectRatio: "1600 / 947", opacity: photoOpacity }}
      >
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}

interface StackedListProps {
  pastProjects: Project[];
  slotRef: React.RefObject<HTMLLIElement | null>;
  useEs: boolean;
}

function StackedList({ pastProjects, slotRef, useEs }: StackedListProps) {
  const visible = pastProjects.slice(-VISIBLE_LIST_ROWS);
  const startIndex = pastProjects.length - visible.length;

  return (
    <ol
      className="flex flex-col gap-0"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0, black 32px, black 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, black 32px, black 100%)",
      }}
    >
      {visible.map((p, i) => {
        const realIndex = startIndex + i;
        return (
          <li
            key={p.id}
            className="flex items-baseline gap-3 border-b border-black/10 py-2"
          >
            <span className="w-6 font-mono text-[10px] tracking-wider text-black/40">
              {String(realIndex + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 truncate text-[15px] font-bold tracking-tight text-black/80">
              {p.title}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/40">
              {useEs ? (p.categoryEs ?? p.category) : p.category}
            </span>
          </li>
        );
      })}
      <li ref={slotRef} aria-hidden className="h-0 overflow-hidden" />
    </ol>
  );
}

export default function WorkStack() {
  const { t, locale } = useI18n();
  const useEs = locale === "es";
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLLIElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [local, setLocal] = useState(0);
  const [throwY, setThrowY] = useState(-200);

  const stepRef = useRef(0);
  const animatingRef = useRef(false);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useLayoutEffect(() => {
    if (!slotRef.current || !focusRef.current) return;
    const sRect = slotRef.current.getBoundingClientRect();
    const fRect = focusRef.current.getBoundingClientRect();
    setThrowY(sRect.top - fRect.top);
  }, [step]);

  const runAnim = (from: number, to: number, onDone?: () => void) => {
    animatingRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / TRANSITION_MS, 1);
      const eased = easeInOutQuad(t);
      setLocal(from + (to - from) * eased);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
        onDone?.();
      }
    };
    requestAnimationFrame(tick);
  };

  const settleIn = () => {
    animatingRef.current = true;
    setLocal(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runAnim(1, 0);
      });
    });
  };

  const goForward = () => {
    if (animatingRef.current) return;
    if (stepRef.current >= STEPS - 1) return;
    runAnim(0, 1, () => {
      setStep((s) => s + 1);
      settleIn();
    });
  };

  const goBackward = () => {
    if (animatingRef.current) return;
    if (stepRef.current <= 0) return;
    setStep((s) => s - 1);
    settleIn();
  };

  useEffect(() => {
    const section = sectionRef.current;
    const container = document.querySelector(".snap-y") as HTMLElement | null;
    if (!section || !container) return;

    let touchStartY = 0;
    let touchDelta = 0;
    let touchPeakDelta = 0;

    const isPinned = () => {
      const sRect = section.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      return Math.abs(sRect.top - cRect.top) < 50;
    };

    const onWheel = (e: WheelEvent) => {
      if (!isPinned()) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      const sign = Math.sign(e.deltaY);
      if (animatingRef.current) {
        e.preventDefault();
        return;
      }
      const canStep =
        (sign > 0 && stepRef.current < STEPS - 1) ||
        (sign < 0 && stepRef.current > 0);
      if (!canStep) return;
      e.preventDefault();
      if (sign > 0) goForward();
      else goBackward();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchDelta = 0;
      touchPeakDelta = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPinned()) return;
      const currentY = e.touches[0].clientY;
      touchDelta = touchStartY - currentY;
      if (Math.abs(touchDelta) > Math.abs(touchPeakDelta)) {
        touchPeakDelta = touchDelta;
      }

      const atTopEdge = stepRef.current <= 0;
      const atBottomEdge = stepRef.current >= STEPS - 1;

      // Mid-stack: either direction is captured regardless of sign, so
      // preventDefault on the very first touchmove — Android Chrome commits
      // to native scroll for the whole gesture if the first move isn't
      // cancelled, and later preventDefault() calls are ignored (unlike iOS).
      if (!atTopEdge && !atBottomEdge) {
        e.preventDefault();
        return;
      }

      if (Math.abs(touchDelta) < 5) return;
      const sign = Math.sign(touchDelta);
      const canStep =
        (sign > 0 && !atBottomEdge) || (sign < 0 && !atTopEdge);
      if (canStep) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!isPinned()) return;
      if (animatingRef.current) return;
      // Decide direction from the gesture's peak displacement, not the last
      // touchmove sample — Android's touch coalescing/prediction can correct
      // a fast flick's final sample back past the start point right before
      // touchend, which would otherwise flip the sign of a clean forward swipe.
      if (Math.abs(touchPeakDelta) < TOUCH_THRESHOLD) return;
      const sign = Math.sign(touchPeakDelta);
      if (sign > 0) goForward();
      else goBackward();
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      section.removeEventListener("wheel", onWheel);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const current = STACK_PROJECTS[step];
  const past = STACK_PROJECTS.slice(0, step);

  return (
    <section ref={sectionRef} id="work" className="h-dvh snap-start snap-always">
      <div className="flex h-full flex-col overflow-hidden bg-white text-black">
        <header className="pl-14 pr-6 pt-12 pb-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[24px] font-bold leading-[1.05] tracking-tight">
              {t.work.title}
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">
              {String(step + 1).padStart(2, "0")} / {STEPS}
            </span>
          </div>
        </header>

        <div className="pl-14 pr-6 pb-2">
          <StackedList pastProjects={past} slotRef={slotRef} useEs={useEs} />
        </div>

        <div
          ref={focusRef}
          className="relative flex flex-1 flex-col justify-center pl-14 pr-6 pb-6"
        >
          <Current
            project={current}
            index={step}
            local={local}
            throwY={throwY}
            useEs={useEs}
          />
        </div>
      </div>
    </section>
  );
}
