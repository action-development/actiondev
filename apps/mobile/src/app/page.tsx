"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const Logo3DEasterEgg = dynamic(
  () => import("@/components/Logo3DEasterEgg"),
  { ssr: false }
);

const LogoHeader3D = dynamic(
  () => import("@/components/LogoHeader3D"),
  { ssr: false }
);

const WorkFeed = dynamic(
  () => import("@/components/WorkFeed"),
  { ssr: false }
);

const AboutExperience = dynamic(
  () => import("@/components/AboutExperience"),
  { ssr: false }
);

// "word" = animate whole word, "letter" = animate each letter individually
type FxType = { class: string; mode: "word" } | { class: string; mode: "letter" };

const IDLE_EFFECTS: FxType[] = [
  { class: "fx-blink", mode: "word" },
  { class: "fx-bounce", mode: "word" },
  { class: "fx-wave", mode: "letter" },
  { class: "fx-pulse", mode: "word" },
  { class: "fx-flipX", mode: "letter" },
  { class: "fx-rubberband", mode: "word" },
  { class: "fx-spinY", mode: "letter" },
  { class: "fx-swing", mode: "word" },
  { class: "fx-cascade-bounce", mode: "letter" },
  { class: "fx-glitch", mode: "word" },
  { class: "fx-tracking", mode: "word" },
  { class: "fx-tumble", mode: "letter" },
  { class: "fx-shake", mode: "word" },
  { class: "fx-elastic", mode: "letter" },
  { class: "fx-wobble", mode: "word" },
  { class: "fx-flipY", mode: "letter" },
  { class: "fx-jello", mode: "word" },
  { class: "fx-stagger-scale", mode: "letter" },
  { class: "fx-float", mode: "word" },
  { class: "fx-domino", mode: "letter" },
  { class: "fx-typewriter", mode: "letter" },
  { class: "fx-swing", mode: "word" },
  { class: "fx-wave", mode: "letter" },
  { class: "fx-rubberband", mode: "word" },
  { class: "fx-spinY", mode: "letter" },
  { class: "fx-bounce", mode: "word" },
  { class: "fx-tumble", mode: "letter" },
  { class: "fx-glitch", mode: "word" },
  { class: "fx-flipX", mode: "letter" },
  { class: "fx-jello", mode: "word" },
];

const WORDS = [
  "Click",
  "Hey",
  "there",
  "What's",
  "up",
  "We're",
  "Action",
  "Development",
  "well",
  "Action",
  "Dev",
  "for",
  "the",
  "friends",
  ";)",
  "We",
  "build",
  "apps",
  "webs",
  "and",
  "cool",
  "digital",
  "stuff",
  "from",
  "Vigo",
  "so",
  "you're",
  "basically",
  "on",
  "a",
  "website",
  "full",
  "of",
  "clean",
  "code",
  "and",
  "mass",
  "caffeine",
  "No",
  "seriously",
  "welcome",
  "Ok",
  "looks",
  "like",
  "you're",
  "just",
  "clicking",
  "around",
  "We",
  "like",
  "you",
  "already",
  "Let's",
  "make",
  "a",
  "deal",
  "get",
  "to",
  "the",
  "end",
  "and",
  "we'll",
  "buy",
  "you",
  "a",
  "BEER",
  "Lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "Nah",
  "we're",
  "not",
  "those",
  "devs",
  "The",
  "beer's",
  "waiting",
  "in",
  "the",
  "cart",
];

function playKaching() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Metallic hit
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "square";
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Bell ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2400, now + 0.05);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.4);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not supported
  }
}

function WordDisplay({
  word,
  wordIndex,
  idle,
  isFinished,
}: {
  word: string;
  wordIndex: number;
  idle: boolean;
  isFinished: boolean;
}) {
  const fx = IDLE_EFFECTS[wordIndex % IDLE_EFFECTS.length];
  const base = `text-center text-5xl font-bold text-black ${isFinished ? "" : "cursor-pointer"}`;

  if (idle && fx.mode === "letter") {
    return (
      <h1 key={wordIndex} className={`${base} flex justify-center`}>
        {word.split("").map((char, i) => (
          <span
            key={i}
            className={`inline-block ${fx.class}`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <h1 key={wordIndex} className={`${base} ${idle ? fx.class : ""}`}>
      {word}
    </h1>
  );
}

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; word: string; exiting: boolean }[]
  >([]);
  const toastIdRef = useRef(0);
  const [idle, setIdle] = useState(false);
  const [logoAnimating, setLogoAnimating] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [workFeedOpen, setWorkFeedOpen] = useState(false);
  const [aboutProgress, setAboutProgress] = useState(0);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFinished = wordIndex >= WORDS.length - 1;
  const currentWord = WORDS[wordIndex];

  useEffect(() => {
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), 1200);
    return () => clearTimeout(timer);
  }, [wordIndex]);

  // Auto-open cart when sequence finishes
  useEffect(() => {
    if (isFinished) {
      setCartCount(1);
      const timer = setTimeout(() => setCartOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  // Sync safe areas / theme-color with work feed state
  useEffect(() => {
    const meta = document.getElementById("theme-color-meta");
    if (meta) meta.setAttribute("content", workFeedOpen ? "#000000" : "#ffffff");
    document.body.style.background = workFeedOpen ? "#000000" : "#ffffff";
    return () => {
      if (meta) meta.setAttribute("content", "#ffffff");
      document.body.style.background = "#ffffff";
    };
  }, [workFeedOpen]);

  // Track about scroll progress
  useEffect(() => {
    const container = scrollContainerRef.current;
    const aboutEl = aboutSectionRef.current;
    if (!container || !aboutEl) return;

    const onScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const aboutRect = aboutEl.getBoundingClientRect();
      // How far past the snap point we've scrolled into About
      const scrolledInto = containerRect.top - aboutRect.top;
      const scrollableHeight = aboutEl.clientHeight - container.clientHeight;
      if (scrolledInto > 0 && scrollableHeight > 0) {
        setAboutProgress(Math.min(scrolledInto / scrollableHeight, 1));
      } else {
        setAboutProgress(0);
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section via scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const sections = container.querySelectorAll("section[id]");
      let closest = "home";
      let minDist = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = Math.abs(rect.top - containerRect.top);
        if (offset < minDist) {
          minDist = offset;
          closest = section.id;
        }
      });

      setActiveSection(closest);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    const target = document.getElementById(id);
    if (!container || !target) return;
    container.scrollTo({
      top: target.offsetTop,
      behavior: "smooth",
    });
  }, []);

  const handleClick = useCallback(() => {
    if (isFinished) return;

    const clickedWord = WORDS[wordIndex];

    {
      playKaching();
      setCartCount((c) => c + 1);
      setCartItems((prev) => [...prev, clickedWord]);

      const id = ++toastIdRef.current;
      setToasts((prev) => {
        const next = [...prev, { id, word: clickedWord, exiting: false }];
        const visible = next.filter((t) => !t.exiting);
        if (visible.length > 8) {
          const oldest = visible[0];
          setTimeout(() => {
            setToasts((p) => p.filter((t) => t.id !== oldest.id));
          }, 800);
          return next.map((t) =>
            t.id === oldest.id ? { ...t, exiting: true } : t
          );
        }
        return next;
      });
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 800);
      }, 1250);
    }

    setWordIndex((i) => i + 1);
  }, [wordIndex, isFinished]);

  const handleScreenTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("nav") ||
        target.closest("[data-cart]") ||
        target.closest("[data-sidebar]") ||
        target.closest("[data-logo]")
      )
        return;
      handleClick();
    },
    [handleClick]
  );

  // Group cart items: { word, count }
  const groupedItems = cartItems.reduce<{ word: string; count: number }[]>(
    (acc, word) => {
      const existing = acc.find((item) => item.word === word);
      if (existing) existing.count++;
      else acc.push({ word, count: 1 });
      return acc;
    },
    []
  );

  return (
    <div
      className="relative h-dvh w-full select-none overflow-hidden bg-white"
      onClick={handleScreenTap}
    >
      {/* Scroll-snap container — blurs during Easter egg */}
      <div
        ref={scrollContainerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto transition-[filter] duration-700 ease-in-out"
        style={{ filter: logoAnimating ? "blur(12px)" : "blur(0px)" }}
      >

      {/* ===== HOME SECTION ===== */}
      <section id="home" className="relative flex h-dvh snap-start flex-col">
        {/* Header */}
        <header className="flex items-start justify-between p-5">
          <div ref={logoContainerRef} data-logo>
            <LogoHeader3D
              visible={!logoAnimating}
              onClick={() => setLogoAnimating(true)}
            />
          </div>

          <button
            data-cart
            className="flex items-center gap-1.5 text-xl font-medium"
            onClick={() => {
              if (cartCount === 0) {
                handleClick();
              } else {
                setCartOpen(true);
              }
            }}
          >
            <span>{cartCount}</span>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </button>
        </header>

        {/* Toasts */}
        <div className="absolute top-14 right-5 left-5 z-50 flex max-h-[40dvh] flex-col-reverse items-end overflow-hidden">
          {[...toasts].reverse().map((t) => (
            <div
              key={t.id}
              className={`toast-wrapper ${t.exiting ? "toast-collapse" : ""}`}
            >
              <div
                className={`toast-pill ${t.exiting ? "toast-fade-out" : "toast-fade-in"}`}
              >
                &ldquo;{t.word}&rdquo; successfully added to cart
              </div>
            </div>
          ))}
        </div>

        {/* Main word / end state */}
        <main ref={mainRef} className="flex flex-1 items-center justify-center px-8">
          {isFinished ? (
            <div className="flex flex-col items-center gap-6">
              <button
                className="text-5xl font-bold text-black transition-opacity hover:opacity-60"
                onClick={() => scrollTo("work")}
              >
                Works
              </button>
              <button
                className="text-5xl font-bold text-black/40 transition-opacity hover:opacity-60"
                onClick={() => scrollTo("about")}
              >
                About
              </button>
            </div>
          ) : (
            <WordDisplay
              word={currentWord}
              wordIndex={wordIndex}
              idle={idle}
              isFinished={isFinished}
            />
          )}
        </main>
      </section>

      {/* ===== WORK SECTION ===== */}
      <section id="work" className="relative flex h-dvh snap-start flex-col items-center justify-center overflow-hidden">
        {/* Finger tap image — background layer with animation */}
        <img
          src="/recursos/dedo-clic.webp"
          alt=""
          className={`pointer-events-none absolute left-[62%] top-[53%] -translate-x-1/3 -translate-y-1/3 transition-opacity duration-700 ${activeSection === "work" ? "animate-work-tap opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: activeSection === "work" ? "1s" : "0s", width: "35%" }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); setWorkFeedOpen(true); }}
          className="group relative z-10 flex flex-col items-center gap-3"
        >
          <h1 className="text-6xl font-bold text-black transition-transform duration-300 group-active:scale-95">Work</h1>
          <span className="animate-pulse text-sm font-medium tracking-wider text-black/30 uppercase">Tap to explore</span>
        </button>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section ref={aboutSectionRef} id="about" className="snap-start" style={{ height: "600vh" }}>
        <div className="sticky top-0 h-dvh">
          <AboutExperience progress={aboutProgress} />
        </div>
      </section>

      </div>

      {/* Side nav — vertical, bottom-left, fixed over sections */}
      <nav className="absolute bottom-28 left-8 z-50 flex origin-bottom-left -rotate-90 items-baseline gap-4">
        {[
          { id: "about", label: "About" },
          { id: "work", label: "Work" },
          { id: "home", label: "Home" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={(e) => { e.stopPropagation(); scrollTo(id); }}
            className={`text-lg transition-colors duration-300 ${
              activeSection === id
                ? "font-bold text-black"
                : "font-medium text-black/40"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Work feed overlay */}
      <div
        className={`fixed inset-0 z-[150] bg-black transition-all duration-500 ${
          workFeedOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {workFeedOpen && (
          <WorkFeed onBack={() => setWorkFeedOpen(false)} />
        )}
      </div>

      {/* 3D Logo Easter Egg */}
      <Logo3DEasterEgg
        active={logoAnimating}
        logoRect={logoContainerRef.current?.getBoundingClientRect() ?? null}
        targetRect={mainRef.current?.getBoundingClientRect() ?? null}
        onAnimationEnd={() => setLogoAnimating(false)}
      />

      {/* Cart sidebar overlay */}
      <div
        data-sidebar
        className={`fixed inset-0 z-[100] transition-opacity duration-400 ${
          cartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/15"
          onClick={() => setCartOpen(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 flex w-[82%] flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            cartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header — black block */}
          <div className="flex items-center justify-between bg-black px-6 py-5">
            <h2 className="text-base font-bold tracking-wide text-white uppercase">
              &ldquo;Cart&rdquo;
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40 text-white transition-colors active:bg-white/10"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto bg-white px-6 pt-5 pb-4">
            {(isFinished
              ? [{ word: "BEER", count: 1 }]
              : groupedItems
            ).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-black/6 py-3.5"
              >
                <span className="text-sm font-bold tracking-wide text-black uppercase">
                  &ldquo;{item.word}&rdquo;
                </span>
                <span className="text-sm font-bold text-black">
                  x{item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-white px-6 pb-4">
            <div className="border-t border-black pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-black">Total</span>
                <span className="text-base font-bold text-black">
                  {isFinished ? 1 : cartCount}
                </span>
              </div>
              <button className="mt-4 w-full border border-black py-3 text-center text-sm font-bold tracking-wider text-black uppercase transition-colors active:bg-black active:text-white">
                &ldquo;Check me out!&rdquo;
              </button>
            </div>
          </div>

          {/* Contact — black block */}
          <div className="flex flex-col items-center gap-2.5 bg-black px-6 py-5">
            <a
              href="mailto:hi@actiondev.es"
              className="text-xs font-bold tracking-wider text-white/70 uppercase"
            >
              hi@actiondev.es
            </a>
            <div className="flex items-center gap-5">
              <a href="#" className="text-white/50 transition-colors active:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="text-white/50 transition-colors active:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
