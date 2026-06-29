"use client";

import { useRef, useState, type ReactElement } from "react";
import { useI18n } from "@/lib/i18n/context";

type AiTarget = {
  id: string;
  name: string;
  tagline: string;
  href: string;
  Icon: () => ReactElement;
  accent: string;
};

function ClaudeIcon() {
  return <img src="/ai-logos/claude.webp" alt="" width={28} height={28} loading="lazy" className="h-7 w-7" />;
}

function OpenAiIcon() {
  return <img src="/ai-logos/chatgpt.webp" alt="" width={28} height={28} loading="lazy" className="h-7 w-7" />;
}

function GeminiIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
      <path d="M16 0c0 8.8 7.2 16 16 16-8.8 0-16 7.2-16 16 0-8.8-7.2-16-16-16 8.8 0 16-7.2 16-16z" />
    </svg>
  );
}

function buildAiTargets(askPrompt: string): AiTarget[] {
  return [
    {
      id: "claude",
      name: "Claude",
      tagline: "by Anthropic",
      href: `https://claude.ai/new?q=${encodeURIComponent(askPrompt)}`,
      Icon: ClaudeIcon,
      accent: "#cc785c",
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      tagline: "by OpenAI",
      href: `https://chatgpt.com/?q=${encodeURIComponent(askPrompt)}`,
      Icon: OpenAiIcon,
      accent: "#10a37f",
    },
    {
      id: "gemini",
      name: "Gemini",
      tagline: "by Google",
      href: `https://gemini.google.com/app?q=${encodeURIComponent(askPrompt)}`,
      Icon: GeminiIcon,
      accent: "#4f87ff",
    },
  ];
}

function AiButton({
  target,
  askPrompt,
  labelFor,
  copiedLabel,
}: {
  target: AiTarget;
  askPrompt: string;
  labelFor: (name: string) => string;
  copiedLabel: string;
}) {
  const Icon = target.Icon;
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(askPrompt).catch(() => {});
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2400);
  };

  return (
    <a
      href={target.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-3 transition-colors duration-300 active:border-black/40"
      style={{ ["--accent" as string]: target.accent }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.04] text-black transition-colors duration-300 group-active:text-[var(--accent)]">
        <Icon />
      </span>
      <span className="flex flex-1 flex-col gap-0.5 text-left">
        <span className="text-base font-bold tracking-tight text-black">
          {labelFor(target.name)}
        </span>
        <span
          aria-live="polite"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40"
        >
          {copied ? copiedLabel : target.tagline}
        </span>
      </span>
      <span
        aria-hidden
        className="font-mono text-[14px] text-black/40 transition-colors duration-300 group-active:text-[var(--accent)]"
      >
        ↗
      </span>
    </a>
  );
}

export default function EndPanelContent() {
  const { t } = useI18n();
  const targets = buildAiTargets(t.endPanel.askPrompt);

  return (
    <div className="flex h-full w-full flex-col text-black">
      <div className="flex flex-1 flex-col gap-3 pl-14 pr-6 pt-24 pb-3">
        <h2 className="text-right text-[26px] font-bold leading-[1.05] tracking-tight text-black">
          {t.endPanel.title1}<br />
          <span className="underline decoration-black/30 decoration-2 underline-offset-[5px]">
            {t.endPanel.title2}
          </span>
        </h2>

        <p className="ml-auto max-w-xs text-right text-[13px] leading-snug text-black/60">
          {t.endPanel.subtitle}
        </p>

        <div className="mt-1 flex flex-col gap-2.5">
          {targets.map((target) => (
            <AiButton
              key={target.id}
              target={target}
              askPrompt={t.endPanel.askPrompt}
              labelFor={t.endPanel.askLabel}
              copiedLabel={t.endPanel.copied}
            />
          ))}
        </div>
      </div>

      <footer className="border-t border-black/10 pl-14 pr-6 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-[22px] font-bold tracking-tight text-black">Action Dev</h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
            Vigo · ES
          </span>
        </div>

        <p className="mt-2 max-w-xs text-[12px] leading-snug text-black/55">
          {t.endPanel.footerTagline}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <a
            href="mailto:hi@actiondev.es"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/70 transition-colors active:text-black"
          >
            hi@actiondev.es
          </a>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/action-development/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-black/45 transition-colors active:text-black"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/action.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-black/45 transition-colors active:text-black"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
          <span>{t.endPanel.footerStat}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
