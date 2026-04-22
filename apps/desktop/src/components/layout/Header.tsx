"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/data/navigation";
import { useActiveSection } from "@/hooks/use-active-section";

export function Header() {
  const pathname = usePathname();
  const activeSection = useActiveSection(pathname === "/");

  function isActive(href: string): boolean {
    if (pathname !== "/") return pathname === href;
    if (href === "/") return activeSection === "home";
    const id = href.replace("/#", "");
    return activeSection === id;
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      role="banner"
    >
      {/* Atmospheric fade behind the bar — contrast without drawing a container. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/70 to-transparent"
      />

      <nav
        aria-label="Main navigation"
        className="relative container-editorial flex items-center gap-10 py-6 pointer-events-auto"
      >
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="Action — Home"
          className="group flex items-baseline gap-1 font-mono text-[13px] font-bold uppercase tracking-[0.22em] text-foreground"
        >
          <span>Action</span>
          <span
            aria-hidden
            className="translate-y-[1px] text-accent transition-transform duration-[var(--duration-slow)] group-hover:rotate-90"
          >
            ●
          </span>
        </Link>

        {/* Nav items */}
        <ul role="list" className="hidden md:flex items-center ml-auto gap-10">
          {navigation.slice(1).map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group relative inline-flex py-2"
                >
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.28em] transition-colors ${
                      active ? "text-foreground" : "text-muted group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Hairline — scales from left; stays at full width when active */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute bottom-1 left-0 right-0 h-px origin-left bg-accent transition-transform duration-[var(--duration-slow)] ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA — typographic, not a button */}
        <Link
          href="/#contact"
          className="group relative hidden md:inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-foreground"
        >
          {/* Availability dot — pulses to signal 'open for work' */}
          <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="relative py-2">
            Let&apos;s talk
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-1 left-0 right-0 h-px origin-left scale-x-0 bg-foreground transition-transform duration-[var(--duration-slow)] group-hover:scale-x-100"
            />
          </span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-[var(--duration-slow)] group-hover:translate-x-1"
          >
            ↗
          </span>
        </Link>
      </nav>
    </header>
  );
}
