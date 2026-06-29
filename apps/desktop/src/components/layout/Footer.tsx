"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { useT } from "@/lib/i18n";
import { CONTACT, SOCIALS } from "@/data/socials";

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
        {/* ── Hero row: wordmark + CTA ── */}
        <div className="grid gap-16 lg:grid-cols-12 lg:items-end">
          <div data-anim="reveal" className="lg:col-span-7">
            <Link
              href="/"
              aria-label={`${t.scroll.hero} — Action Development`}
              className="group inline-flex"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/logo.webp"
                alt="Action Development"
                className="h-20 w-auto invert opacity-80 transition-opacity duration-[var(--duration)] group-hover:opacity-100 md:h-28"
              />
            </Link>
            <p className="lede mt-8">{t.footer.tagline}</p>
            <div className="mt-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <span>{t.footer.available}</span>
            </div>
          </div>

          <div data-anim="reveal" className="flex flex-col gap-6 lg:col-span-5 lg:items-end">
            <p className="micro-label text-foreground/60">{t.footer.workWithUs}</p>
            <Link
              href="/#contact"
              className="group inline-flex items-baseline gap-3 text-foreground"
              aria-label={t.footer.workCTA}
            >
              <span className="display-m">{t.footer.workCTA}</span>
              <span
                aria-hidden
                className="text-accent transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:translate-x-1 group-hover:-translate-y-1"
              >
                ↗
              </span>
            </Link>
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-foreground"
            >
              {CONTACT.email}
            </a>
          </div>
        </div>

        {/* ── Hairline divider ── */}
        <div className="hairline my-16" />

        {/* ── Column grid: sitemap / social / legal ── */}
        <div className="grid gap-12 sm:grid-cols-3">
          <nav data-anim="reveal" aria-label={t.footer.sitemapTitle} className="flex flex-col gap-5">
            <p className="micro-label text-foreground/50">{t.footer.sitemapTitle}</p>
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
