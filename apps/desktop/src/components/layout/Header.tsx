"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/data/navigation";
import { useLocale, useT } from "@/lib/i18n";
import { getLenis } from "@/hooks/use-lenis";
import { usePageTransition } from "@/components/animations/PageTransition";
import { resolveTimeOfDay, type TimeOfDay } from "@/components/canvas/port/time-of-day";
import styles from "./Header.module.css";

/** Coordenadas del puerto de Vigo, en el formato de una pantalla de a bordo. */
const COORDS = "42.24°N 8.72°W";

interface Telemetry {
  clock: string;
  phase: TimeOfDay;
}

/**
 * Reloj local + fase del día del hero (mismo `resolveTimeOfDay` y misma query
 * `?hora=` que `GameScene`, así el HUD dice lo que se ve en el cielo). Se
 * resuelve solo en cliente: en SSR se pinta un placeholder para no romper la
 * hidratación con la hora del servidor.
 */
function useTelemetry(): Telemetry | null {
  const [data, setData] = useState<Telemetry | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const search = new URLSearchParams(window.location.search);
      setData({
        clock: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        phase: resolveTimeOfDay(now, search.get("hora")),
      });
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return data;
}

/** Scroll mínimo (px) entre eventos para contar como cambio de dirección. */
const SCROLL_DELTA = 6;
/** Por encima de esta posición (px) el header siempre está visible. */
const ALWAYS_SHOW_BELOW = 80;

/**
 * `true` cuando el header debe esconderse: al bajar más allá de
 * `ALWAYS_SHOW_BELOW`. Al subir (o al volver arriba) reaparece. Lenis mueve el
 * scroll nativo, así que basta el evento `scroll` de `window`. Solo hace
 * `setState` al cambiar de estado, no en cada evento.
 */
function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < ALWAYS_SHOW_BELOW) {
        setHidden(false);
      } else if (Math.abs(y - lastY) >= SCROLL_DELTA) {
        setHidden(y > lastY);
      } else {
        return;
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

/**
 * Header "holograma": una cápsula proyectada, centrada arriba y ajustada a su
 * contenido (no ocupa el ancho de la pantalla), con el mismo lenguaje que la
 * flecha holográfica del barco (`port/Ship.tsx`): lima translúcido, borde
 * fresnel, barrido que sube, parpadeo y doble imagen. Sin degradado en la
 * home: se proyecta sobre el cielo pintado. Geometría en `Header.module.css`.
 */
export function Header() {
  const pathname = usePathname();
  const { navigate } = usePageTransition();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const telemetry = useTelemetry();
  const hidden = useHideOnScroll();

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault();
    if (pathname === "/") {
      getLenis()?.scrollTo(0, { duration: 1.2 });
    } else {
      navigate("/");
    }
  }

  // Cada entrada del nav es una ruta propia (la home ya no tiene secciones).
  function isActive(href: string): boolean {
    return pathname === href;
  }

  const navLabels: Record<string, string> = {
    Home: t.nav.home,
    Work: t.nav.work,
    Reviews: t.nav.reviews,
    Blog: t.nav.blog,
    Contact: t.nav.contact,
  };

  return (
    <header
      className={`${styles.shell} fixed top-0 left-0 right-0 z-50 pointer-events-none`}
      data-hidden={hidden}
      role="banner"
    >
      {/* Fuera de la home hay contenido que scrollea por debajo: un fundido
          corto para que el HUD lea; en la home el cielo pintado queda limpio. */}
      {pathname !== "/" && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent"
        />
      )}

      <nav
        aria-label={t.nav.ariaLabel}
        data-testid="main-nav"
        className={`${styles.panel} relative mx-auto mt-3 w-fit max-w-[calc(100%-1.5rem)] pointer-events-auto`}
      >
        <span aria-hidden className={`${styles.corner} ${styles.tl}`} />
        <span aria-hidden className={`${styles.corner} ${styles.tr}`} />
        <span aria-hidden className={`${styles.corner} ${styles.bl}`} />
        <span aria-hidden className={`${styles.corner} ${styles.br}`} />

        {/*
          Marca + telemetría: pantalla de a bordo.

          La telemetría va FUERA del `<a>`, y no dentro como antes. Un reloj no
          es la etiqueta de un enlace "ir al inicio": iba `aria-hidden`, pero
          axe compara el nombre accesible con lo que se VE dentro del elemento,
          así que "VIGO 42.24°N … 12:34 · dia" contaba como etiqueta visible y
          el enlace fallaba WCAG 2.5.3 (Label in Name). Sacándola, el enlace se
          llama por su `aria-label` y su zona de click se limita al logo, que es
          lo único que de verdad lleva al inicio. El `div.brand` conserva la
          geometría (mismo flex, mismo gap de 10px).
        */}
        <div className={styles.brand}>
          <Link
            href="/"
            aria-label={t.nav.brandHome}
            className={styles.brandLink}
            onClick={handleLogoClick}
          >
            {/*
              20px de alto sobre un original de 1563×625: en crudo eran 68 KB en
              CADA página (y Next lo precargaba). Por `next/image` baja el
              tamaño servido y las dimensiones explícitas evitan el reflow.
            */}
            <Image
              src="/logos/logo.webp"
              alt=""
              width={50}
              height={20}
              priority
              className={styles.logo}
            />
          </Link>
          <span aria-hidden className={`${styles.divider} hidden lg:block`} />
          <span aria-hidden className={`${styles.telemetry} ${styles.glow} hidden lg:inline-flex`}>
            <span className={styles.led} />
            <span>
              VIGO<b className="hidden 2xl:inline"> {COORDS}</b> ·
            </span>
            <span>
              {telemetry ? (
                <>
                  <b>{telemetry.clock}</b> · {telemetry.phase}
                </>
              ) : (
                <>
                  <b>--:--</b> · sync
                </>
              )}
              <span className={styles.cursor} />
            </span>
          </span>
        </div>

        <span aria-hidden className={`${styles.divider} hidden md:block`} />

        {/* Enlaces: índice + etiqueta, retícula al apuntar */}
        <ul role="list" className={`${styles.nav} hidden md:inline-flex`}>
          {navigation.map((item) => {
            const active = isActive(item.href);
            const label = navLabels[item.label] ?? item.label;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={styles.link}
                >
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <span aria-hidden className={`${styles.divider} hidden md:block`} />

        {/* Idioma: control segmentado */}
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          aria-label={
            locale === "es" ? "ES / EN — Switch to English" : "ES / EN — Cambiar a español"
          }
          data-lang={locale}
          className={`${styles.switch} hidden md:inline-grid`}
        >
          <span aria-hidden className={styles.thumb} />
          <span className={styles.seg} data-on={locale === "es"}>ES</span>
          <span className={styles.seg} data-on={locale === "en"}>EN</span>
        </button>

        {/* CTA: prompt proyectado que se solidifica */}
        <Link href="/contact" className={`${styles.cta} hidden md:inline-flex`}>
          <span aria-hidden className={styles.fill} />
          <span aria-hidden>&gt;</span>
          <span>{t.nav.cta}</span>
          <span aria-hidden className={styles.cursor} />
          <span aria-hidden className={styles.arrow}>↗</span>
        </Link>
      </nav>
    </header>
  );
}
