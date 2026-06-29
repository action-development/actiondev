"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 flex flex-col items-center gap-6 overflow-hidden bg-black px-6 pt-[6vh] text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/logo.webp"
        alt="Action Development"
        className="h-10 w-auto invert opacity-85"
      />

      <Image
        src="/404.webp"
        alt="404"
        width={640}
        height={1136}
        priority
        sizes="(max-width: 480px) 65vw, 320px"
        className="h-auto w-[65vw] max-w-[320px]"
      />

      <p className="max-w-[28ch] text-center text-[15px] leading-snug text-white/70">
        {t.notFound.subtitle}
      </p>

      <Link
        href="/"
        className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white"
      >
        <span aria-hidden>↖</span>
        <span className="relative py-2">
          {t.notFound.cta}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1 left-0 right-0 h-px origin-left scale-x-100 bg-white/60"
          />
        </span>
      </Link>
    </div>
  );
}
