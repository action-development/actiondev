"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigation } from "@/data/navigation";
import { useActiveSection } from "@/hooks/use-active-section";
import { useLocale, useT } from "@/lib/i18n";
import { getLenis } from "@/hooks/use-lenis";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const activeSection = useActiveSection(pathname === "/");
  const { locale, setLocale } = useLocale();
  const t = useT();
  function handleLogoClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      getLenis()?.scrollTo(0, { duration: 1.2 });
    } else {
      router.push("/");
    }
  }

  function isActive(href: string): boolean {
    if (pathname !== "/") return pathname === href;
    if (href === "/") return activeSection === "home";
    const id = href.replace("/#", "");
    return activeSection === id;
  }

  const navLabels: Record<string, string> = {
    Home: t.nav.home,
    Work: t.nav.work,
    Reviews: t.nav.reviews,
    Contact: t.nav.contact,
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      role="banner"
    >
      {/* Taller atmospheric fade — canvas content starts immediately below the bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/60 to-transparent"
      />

      <nav
        aria-label="Main navigation"
        className="relative container-editorial flex items-center gap-10 py-5 pointer-events-auto border-b border-border/20 backdrop-blur-sm"
      >
        {/* Brand mark — logo lockup only (contains globe + "action development." text) */}
        <Link
          href="/"
          aria-label="Action — Home"
          className="group"
          onClick={handleLogoClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/logo.webp"
            alt="Action Development"
            className="h-[52px] w-auto invert opacity-70 transition-opacity duration-[var(--duration)] group-hover:opacity-100"
          />
        </Link>

        {/* Nav items */}
        <ul role="list" className="hidden md:flex items-center ml-auto gap-10">
          {navigation.slice(1).map((item) => {
            const active = isActive(item.href);
            const label = navLabels[item.label] ?? item.label;
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
                    {label}
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

        {/* Language toggle — ES first (primary market), EN second */}
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
          className="hidden md:flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em]"
        >
          <span className={locale === "es" ? "text-foreground" : "text-muted hover:text-foreground transition-colors"}>
            ES
          </span>
          <span className="text-border select-none">|</span>
          <span className={locale === "en" ? "text-foreground" : "text-muted hover:text-foreground transition-colors"}>
            EN
          </span>
        </button>

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
            {t.nav.cta}
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
