"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import { useT } from "@/lib/i18n";
import { SOCIALS } from "@/data/socials";
import { BUSINESS, LEGAL_ENTITY } from "@/lib/seo";

const LEGAL_LINKS = [
  { key: "notice", href: "/legal/aviso-legal" },
  { key: "privacy", href: "/legal/privacy" },
  { key: "terms", href: "/legal/terms" },
  { key: "cookies", href: "/legal/cookies" },
] as const;

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  // Los datos registrales viven en LEGAL_ENTITY, no en las traducciones:
  // la cadena traducida solo aporta la conjunción, los valores vienen del
  // single source of truth compartido con mobile.
  const brandDisclaimer = t.footer.brandDisclaimer
    .replace("{brand}", BUSINESS.alternateName)
    .replace("{legal}", LEGAL_ENTITY.name)
    .replace("{taxId}", LEGAL_ENTITY.taxId);

  const NAV_LINKS = [
    { label: t.scroll.hero, href: "/" },
    { label: t.scroll.work, href: "/projects" },
    { label: t.scroll.reviews, href: "/resenas" },
    { label: t.scroll.contact, href: "/contact" },
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
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      role="contentinfo"
      className="relative"
    >
      <div className="container-editorial pt-24 pb-10">
        {/* ── Column grid: sitemap / social / legal ── */}
        <div className="grid gap-12 sm:grid-cols-3">
          <nav data-anim="reveal" aria-label={t.footer.sitemapTitle} className="flex flex-col gap-5">
            <ul className="flex flex-col gap-3 text-[15px]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-sweep text-foreground/80 hover:text-accent"
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
                    className="link-sweep group inline-flex items-baseline gap-2 text-foreground/80 hover:text-accent"
                  >
                    <span>{s.name}</span>
                    <span aria-hidden className="text-muted text-[12px]">{s.handle}</span>
                    {/* Una flecha que apunta arriba-derecha se mueve arriba y a
                        la derecha, como la del CTA del Header. Antes solo iba
                        en horizontal: el mismo glifo con dos gramáticas. */}
                    <span
                      aria-hidden
                      className="text-muted transition-[transform,color] duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
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
                    className="link-sweep text-foreground/80 hover:text-accent"
                  >
                    {l.key === "notice" && t.footer.legalNotice}
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
          className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted"
        >
          <span>&copy; {year} Action</span>
          <span aria-hidden>·</span>
          <span>{t.footer.rights}</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span className="sm:ml-auto">{t.footer.madeIn}</span>
        </div>

        {/*
          Disclaimer de titularidad (LSSI art. 10). "Action" es una marca, no
          una persona jurídica — sin esto la empresa real es invisible para
          quien evalúe al proveedor (organismos públicos, compliance).
        */}
        <p
          data-anim="reveal"
          className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-muted/70"
        >
          {brandDisclaimer}{" "}
          <Link
            href="/legal/aviso-legal"
            className="underline underline-offset-2 transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] hover:text-accent"
          >
            {t.footer.legalNotice}
          </Link>
        </p>
      </div>
    </footer>
  );
}
