"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

const SOCIALS = [
  { label: "Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Dribbble", href: "#" },
];

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="relative">
      <div className="hairline" />
      <div className="container-editorial py-10">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {/* Wordmark */}
          <Link href="/" className="flex items-baseline gap-1 font-bold text-foreground">
            <span>Action</span>
            <span aria-hidden className="text-accent">●</span>
          </Link>

          <span aria-hidden>·</span>

          <span>&copy; {year}</span>

          <span aria-hidden>·</span>

          <span>Madrid, ES</span>

          <span aria-hidden>·</span>

          {/* Availability dot */}
          <span className="flex items-center gap-2">
            <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span>{t.footer.available}</span>
          </span>

          {/* Socials — pushed to the end of the line on wide viewports */}
          <nav aria-label="Social media" className="ml-auto flex items-center gap-5">
            {SOCIALS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                aria-label={`Follow Action on ${s.label}`}
                className="transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-foreground"
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
