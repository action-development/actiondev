"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-start gap-8 overflow-hidden bg-black px-6 pt-[8vh]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/logo.webp"
        alt="Action Development"
        className="h-12 w-auto invert opacity-80 md:h-14"
      />

      <Image
        src="/404.webp"
        alt="404"
        width={1200}
        height={520}
        priority
        sizes="(max-width: 768px) 92vw, min(70vw, 980px)"
        className="h-auto w-[min(70vw,980px)] max-w-[92vw]"
      />

      <p className="lede max-w-[44ch] text-center">
        {t.notFound.subtitle}
      </p>

      <Link
        href="/"
        className="group inline-flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.22em] text-foreground"
      >
        <span
          aria-hidden
          className="inline-block transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:-translate-x-1"
        >
          ↖
        </span>
        <span className="relative py-2">
          {t.notFound.cta}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1 left-0 right-0 h-px origin-left scale-x-100 bg-accent transition-transform duration-[var(--duration)] [transition-timing-function:var(--ease)] group-hover:scale-x-0"
          />
        </span>
      </Link>
    </div>
  );
}
