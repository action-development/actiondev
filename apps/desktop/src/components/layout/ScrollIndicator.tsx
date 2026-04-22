"use client";

import { useActiveSection } from "@/hooks/use-active-section";
import { usePathname } from "next/navigation";

/**
 * Scroll indicator — the site's signature detail.
 *
 * Fixed column of 4 horizontal ticks on the right edge. The active section's
 * tick extends and carries its label; others are 8px hairlines. Clickable.
 * Hidden on the hero (when 'home' is active) to keep the initial canvas pure;
 * fades in once you scroll past it.
 */

const SECTIONS = [
  { id: "home",     index: "01", label: "Hero",    href: "/"           },
  { id: "projects", index: "02", label: "Work",    href: "/#projects"  },
  { id: "reviews",  index: "03", label: "Reviews", href: "/#reviews"   },
  { id: "contact",  index: "04", label: "Contact", href: "/#contact"   },
] as const;

export function ScrollIndicator() {
  const pathname = usePathname();
  const active = useActiveSection(pathname === "/");
  const isHero = active === "home";

  if (pathname !== "/") return null;

  return (
    <aside
      aria-label="Section progress"
      className={`pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:block transition-opacity duration-[var(--duration-slow)] [transition-timing-function:var(--ease)] ${
        isHero ? "opacity-0" : "opacity-100"
      }`}
    >
      <ul className="flex flex-col items-end gap-5" role="list">
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={section.href}
                aria-label={`Go to ${section.label}`}
                aria-current={isActive ? "true" : undefined}
                className="group pointer-events-auto flex items-center gap-3"
              >
                {/* Label — visible only on active or hover */}
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] ${
                    isActive
                      ? "opacity-100 text-foreground"
                      : "opacity-0 text-muted group-hover:opacity-100"
                  }`}
                >
                  <span className="text-muted">{section.index}</span>
                  <span className="mx-2 text-muted">·</span>
                  <span>{section.label}</span>
                </span>
                {/* Tick — extends on active */}
                <span
                  className={`block h-px transition-all duration-[var(--duration)] [transition-timing-function:var(--ease)] ${
                    isActive
                      ? "w-6 bg-accent"
                      : "w-2 bg-[var(--hairline-strong)] group-hover:w-4 group-hover:bg-foreground"
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
