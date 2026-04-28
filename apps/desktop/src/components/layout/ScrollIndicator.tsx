"use client";

import { useActiveSection } from "@/hooks/use-active-section";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

export function ScrollIndicator() {
  const pathname = usePathname();
  const active = useActiveSection(pathname === "/");
  const isHero = active === "home";
  const t = useT();

  if (pathname !== "/") return null;

  const sections = [
    { id: "home",     index: "01", label: t.scroll.hero,    href: "/"           },
    { id: "projects", index: "02", label: t.scroll.work,    href: "/#projects"  },
    { id: "reviews",  index: "03", label: t.scroll.reviews, href: "/#reviews"   },
    { id: "contact",  index: "04", label: t.scroll.contact, href: "/#contact"   },
  ] as const;

  return (
    <aside
      aria-label={t.scroll.ariaLabel}
      className={`pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:block transition-opacity duration-[var(--duration-slow)] [transition-timing-function:var(--ease)] ${
        isHero ? "opacity-0" : "opacity-100"
      }`}
    >
      <ul className="flex flex-col items-end gap-5" role="list">
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={section.href}
                aria-label={`${t.scroll.goTo} ${section.label}`}
                aria-current={isActive ? "true" : undefined}
                className="group pointer-events-auto flex items-center gap-3"
              >
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
