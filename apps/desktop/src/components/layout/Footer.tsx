"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { useT } from "@/lib/i18n";
import { SOCIALS } from "@/data/socials";

const LEGAL_LINKS = [
  { key: "privacy", href: "/legal/privacy" },
  { key: "terms", href: "/legal/terms" },
  { key: "cookies", href: "/legal/cookies" },
] as const;

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  const NAV_LINKS = [
    { label: t.scroll.hero, href: "/#home" },
    { label: t.scroll.work, href: "/#projects" },
    { label: t.scroll.reviews, href: "/#reviews" },
    { label: t.scroll.contact, href: "/#contact" },
  ];

  useGSAP(
    () => {
      const reveals = gsap.utils.toArray<HTMLElement>("[data-anim='reveal']");
      if (reveals.length) {
        gsap.from(reveals, {
          y: 32,
          opacity: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      gsap.from("[data-anim='rule']", {
        scaleX: 0,
        transformOrigin: "left",
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      role="contentinfo"
      className="relative"
    >
      <div data-anim="rule" className="hairline" />

      <div className="container-editorial pt-24 pb-10">
        {/* ── Column grid: sitemap / social / legal ── */}
        <div className="grid gap-12 sm:grid-cols-3">
          <nav data-anim="reveal" aria-label={t.footer.sitemapTitle} className="flex flex-col gap-5">
            <ul className="flex flex-col gap-3 text-[15px]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground/80 transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav data-anim="reveal" aria-label={t.footer.socialTitle} className="flex flex-col gap-5">
            <p className="micro-label text-foreground/50">{t.footer.socialTitle}</p>
            <ul className="flex flex-col gap-3 text-[15px]">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.name} — ${s.handle}`}
                    className="group inline-flex items-baseline gap-2 text-foreground/80 transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
                  >
                    <span>{s.name}</span>
                    <span aria-hidden className="text-muted text-[12px]">{s.handle}</span>
                    <span
                      aria-hidden
                      className="text-muted transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:translate-x-1 group-hover:text-accent"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav data-anim="reveal" aria-label={t.footer.legalTitle} className="flex flex-col gap-5">
            <p className="micro-label text-foreground/50">{t.footer.legalTitle}</p>
            <ul className="flex flex-col gap-3 text-[15px]">
              {LEGAL_LINKS.map((l) => (
                <li key={l.key}>
                  <Link
                    href={l.href}
                    className="text-foreground/80 transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
                  >
                    {l.key === "privacy" && t.footer.legalPrivacy}
                    {l.key === "terms" && t.footer.legalTerms}
                    {l.key === "cookies" && t.footer.legalCookies}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Bottom bar ── */}
        <div
          data-anim="reveal"
          className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--hairline)] pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted"
        >
          <span>&copy; {year} Action</span>
          <span aria-hidden>·</span>
          <span>{t.footer.rights}</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span className="sm:ml-auto">{t.footer.madeIn}</span>
        </div>
      </div>
    </footer>
  );
}
