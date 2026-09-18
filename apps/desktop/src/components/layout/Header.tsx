"use client";

import { useEffect, useState } from "react";
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
      const devDefault = process.env.NODE_ENV === "development" ? "atardecer" : null;
      setData({
        clock: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        phase: resolveTimeOfDay(now, search.get("hora") ?? devDefault),
      });
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return data;
}

/**
 * Header "holograma": un panel proyectado a todo el ancho con el mismo lenguaje
 * que la flecha holográfica del barco (`port/Ship.tsx`): lima translúcido,
 * borde fresnel, barrido que sube, parpadeo y doble imagen. Sin degradado en
 * la home: se proyecta sobre el cielo pintado. Geometría en `Header.module.css`.
 */
export function Header() {
  const pathname = usePathname();
  const { navigate } = usePageTransition();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const telemetry = useTelemetry();

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
    Contact: t.nav.contact,
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      role="banner"
    >
      {/* Fuera de la home hay contenido que scrollea por debajo: un fundido
          corto para que el HUD lea; en la home el cielo pintado queda limpio. */}
      {pathname !== "/" && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent"
        />
      )}

      <nav
        aria-label="Main navigation"
        className={`${styles.panel} relative mx-6 mt-5 pointer-events-auto`}
      >
        <span aria-hidden className={`${styles.corner} ${styles.tl}`} />
        <span aria-hidden className={`${styles.corner} ${styles.tr}`} />
        <span aria-hidden className={`${styles.corner} ${styles.bl}`} />
        <span aria-hidden className={`${styles.corner} ${styles.br}`} />

        {/* Marca + telemetría: pantalla de a bordo */}
        <Link
          href="/"
          aria-label="Action — Home"
          className={styles.brand}
          onClick={handleLogoClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo.webp" alt="Action Development" className={styles.logo} />
          <span aria-hidden className={`${styles.divider} hidden lg:block`} />
          <span aria-hidden className={`${styles.telemetry} ${styles.glow} hidden lg:flex`}>
            <span className={styles.status}>
              <span className={styles.led} />
              <span>
                VIGO · <b>{COORDS}</b>
              </span>
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
        </Link>

        <span aria-hidden className={`${styles.divider} hidden md:block`} />

        {/* Enlaces: índice + etiqueta, retícula al apuntar */}
        <ul role="list" className={`${styles.nav} hidden md:inline-flex`}>
          {navigation.slice(1).map((item, i) => {
            const active = isActive(item.href);
            const label = navLabels[item.label] ?? item.label;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={styles.link}
                >
                  <span aria-hidden className={styles.index}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
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
          aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
          className={`${styles.switch} hidden md:inline-flex`}
        >
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
