"use client";

import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@actiondev/shared";
import { useI18n } from "@/lib/i18n/context";

const STACK_PROJECTS: Project[] = projects.filter(
  (p) => !p.image.endsWith("placeholder.webp")
);
const STEPS = STACK_PROJECTS.length;
const SECTION_VH = STEPS * 60 + 100;
const VISIBLE_LIST_ROWS = 7;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

interface CurrentProps {
  project: Project;
  index: number;
  local: number;
  isLast: boolean;
  throwY: number;
  useEs: boolean;
}

function Current({ project, index, local, isLast, throwY, useEs }: CurrentProps) {
  const enterT = clamp01(local / 0.25);
  const leaveTRaw = isLast ? 0 : clamp01((local - 0.65) / 0.35);
  const leaveT = leaveTRaw * leaveTRaw;

  const ty = (1 - enterT) * 180 + leaveT * throwY;
  const rowOpacity = enterT * (1 - clamp01((leaveTRaw - 0.92) / 0.08));
  const photoOpacity = enterT * (1 - clamp01(leaveTRaw * 2));

  return (
    <div
      style={{
        transform: `translate3d(0, ${ty}px, 0)`,
        opacity: rowOpacity,
        willChange: "transform, opacity",
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-[36px_1fr_auto] items-baseline gap-3 border-b border-black/15 pb-3">
        <span className="font-mono text-[11px] tracking-wider text-black/40">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[26px] font-bold leading-none tracking-tight text-black">
          {project.title}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
          {useEs ? (project.categoryEs ?? project.category) : project.category}
        </span>
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
  const [progress, setProgress] = useState(0);
  const [throwY, setThrowY] = useState(-200);

  useEffect(() => {
    const container = document.querySelector(".snap-y") as HTMLElement | null;
    const section = sectionRef.current;
    if (!container || !section) return;

    const onScroll = () => {
      const sRect = section.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const scrolled = cRect.top - sRect.top;
      const scrollable = section.clientHeight - container.clientHeight;
      if (scrolled <= 0 || scrollable <= 0) {
        setProgress(0);
        return;
      }
      setProgress(clamp01(scrolled / scrollable));
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const slot = progress * STEPS;
  const currentIndex = Math.min(Math.floor(slot), STEPS - 1);
  const local = clamp01(slot - currentIndex);

  const current = STACK_PROJECTS[currentIndex];
  const past = STACK_PROJECTS.slice(0, currentIndex);

  useEffect(() => {
    if (!slotRef.current || !focusRef.current) return;
    const sRect = slotRef.current.getBoundingClientRect();
    const fRect = focusRef.current.getBoundingClientRect();
    setThrowY(sRect.top - fRect.top);
  }, [currentIndex, past.length]);

  return (
    <section
      ref={sectionRef}
      id="work"
      className="snap-start"
      style={{ height: `${SECTION_VH}vh` }}
    >
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden bg-white text-black">
        <header className="pl-14 pr-6 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-black/30" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
              {t.work.label}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="text-[24px] font-bold leading-[1.05] tracking-tight">
              {t.work.title}
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">
              {String(currentIndex + 1).padStart(2, "0")} / {STEPS}
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
            index={currentIndex}
            local={local}
            isLast={currentIndex === STEPS - 1}
            throwY={throwY}
            useEs={useEs}
          />
        </div>
      </div>
    </section>
  );
}
