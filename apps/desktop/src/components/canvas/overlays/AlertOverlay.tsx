"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameState } from "@/hooks/use-game-state";
import { useT } from "@/lib/i18n";
import { ALERT_RGB, ALERT_RED, ALERT_SECONDS, CRACK_RADIUS, crackPaths, type CrackStroke } from "../port/lighthouse-alert";

/**
 * La alerta del faro (easter egg), de principio a fin. Es el DUEÑO de su
 * reloj: `gameState.onLighthouse` la abre y el impacto de la gaviota
 * (`subscribeScreenHit`) la cierra; `ALERT_SECONDS` es sólo el tope por si
 * ninguna llegó a embestir.
 *
 * No se mezcla con la caza de gaviotas: no da puntos ni abre ronda, y
 * mientras dura no se puede disparar (lo corta `GameWorld`).
 *
 * Vive fuera del `<Canvas>` a propósito: la grieta rompe la cuarta pared, así
 * que tiene que estar sobre el cristal del navegador, no dentro del mundo 3D.
 *
 * Tres capas:
 * - Aviso central al abrirse, con el mismo lenguaje que los de la ronda.
 * - Viñeteado rojo mientras dura la alerta (excepción consciente al "sin
 *   gradientes" del sistema de diseño: es un efecto de juego, aria-hidden y
 *   sin `pointer-events`, no forma parte del lenguaje visual de la web).
 * - La grieta de la gaviota estrellada (`gameState.subscribeScreenHit`), con
 *   su fogonazo. Ocupa la VENTANA ENTERA: el dibujo de `crackPaths` viene
 *   normalizado a radio `CRACK_RADIUS` y aquí se escala hasta la diagonal de
 *   la ventana, así que salga por donde salga llega a las cuatro esquinas.
 *   El grosor del trazo se divide por esa misma escala para que la grieta no
 *   engorde con el tamaño de la pantalla.
 */

/**
 * Vida de una grieta (ms): lo que tarda en apagarse del todo y, a la vez, el
 * temporizador que la saca del DOM. Se pasa a `.crack` como `animationDuration`
 * en línea para que las dos cosas no puedan desincronizarse — si el CSS durase
 * menos, la grieta se quedaría invisible ocupando sitio; si durase más,
 * desaparecería de golpe a media opacidad.
 */
const CRACK_MS = 7000;
/**
 * Grietas a la vez como mucho. Normalmente sólo hay una — la alerta acaba con
 * el choque —, pero se puede volver a pinchar el faro antes de que se borre.
 */
const MAX_CRACKS = 2;
/**
 * Viñeteado de alarma. El degradado se escribe aquí y no en `globals.css`
 * porque Lightning CSS descarta `rgb(var(--x) / α)` al compilar — la regla se
 * quedaba sin fondo y no se veía nada. `transparent` como primera parada sí
 * vale: los degradados CSS interpolan premultiplicado (a diferencia de
 * `color-mix(…, transparent)`, que tira a negro y lo ensucia todo de gris).
 */
const rgba = (a: number) => `rgba(${ALERT_RGB.join(",")},${a})`;
const VIGNETTE = `radial-gradient(ellipse at center, transparent 38%, ${rgba(0.2)} 70%, ${rgba(0.58)} 100%)`;

/**
 * Grosor del trazo en píxeles de pantalla: sombra del corte y filo. Generoso a
 * propósito — la grieta cruza 1.700 px de diagonal y con trazo fino se leía
 * como hilos de araña en vez de como cristal partido.
 */
const STROKE_INK = 8;
const STROKE_EDGE = 3.4;

interface Crack {
  id: number;
  /** Punto del impacto y tamaño de la ventana, en píxeles (medidos al golpe). */
  x: number;
  y: number;
  w: number;
  h: number;
  paths: CrackStroke[];
}

/** Lo que el aviso central está en pantalla (igual que `.tally-banner`). */
const BANNER_MS = 1000;

export function AlertOverlay({ gameState }: { gameState: GameState }) {
  const t = useT();
  const [cracks, setCracks] = useState<Crack[]>([]);
  /** Aviso central: el `id` cambia en cada alerta para reiniciar la animación. */
  const [banner, setBanner] = useState(0);
  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  /*
   * Se depende de las PIEZAS, no de `gameState`: el hook devuelve un objeto
   * nuevo en cada render de `GameScene`, así que con `[gameState]` los efectos
   * se volvían a montar a mitad de partida y su limpieza apagaba la alerta
   * antes de que la gaviota llegara a estrellarse. Los callbacks son
   * `useCallback([])` y lo demás son refs: todo estable de por vida.
   */
  const { onLighthouse, gullAlert, setAlert, subscribeAlert, subscribeScreenHit } = gameState;

  const subscribe = useCallback((onChange: () => void) => subscribeAlert(onChange), [subscribeAlert]);
  const alert = useSyncExternalStore(subscribe, () => gullAlert.current.active, () => false);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(0), BANNER_MS);
    return () => window.clearTimeout(id);
  }, [banner]);

  // Reloj de la alerta: la abre el faro, la cierra el choque (o el tope).
  useEffect(() => {
    let failsafe = 0;
    const close = () => {
      window.clearTimeout(failsafe);
      failsafe = 0;
      setAlert(false);
    };
    onLighthouse.current = () => {
      // Ya sonando: el segundo click no hace nada, como la bocina del barco.
      if (gullAlert.current.active) return;
      setAlert(true);
      setBanner(Date.now());
      failsafe = window.setTimeout(close, ALERT_SECONDS * 1000);
    };
    const offHit = subscribeScreenHit(close);
    return () => {
      onLighthouse.current = null;
      offHit();
      close();
    };
  }, [onLighthouse, gullAlert, setAlert, subscribeScreenHit]);

  useEffect(() => {
    const off = subscribeScreenHit((ndcX, ndcY) => {
      const id = ++nextId.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCracks((list) => [
        // Se queda con las últimas: la nueva siempre entra.
        ...list.slice(Math.max(0, list.length + 1 - MAX_CRACKS)),
        {
          id,
          x: ((ndcX + 1) / 2) * w,
          y: ((1 - ndcY) / 2) * h,
          w,
          h,
          paths: crackPaths(id * 9973),
        },
      ]);
      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        setCracks((list) => list.filter((c) => c.id !== id));
      }, CRACK_MS);
      timers.current.add(timer);
    });
    const pending = timers.current;
    return () => {
      off();
      for (const timer of pending) window.clearTimeout(timer);
      pending.clear();
    };
  }, [subscribeScreenHit]);

  return (
    <>
      {/* Aviso central al abrirse la alerta. Reutiliza las animaciones de los
          avisos de la ronda (`.tally-banner*`): mismo lenguaje de videojuego. */}
      {banner > 0 && (
        <div
          key={banner}
          className="pointer-events-none absolute inset-x-0 top-[26%] z-30 flex select-none justify-center"
          data-testid="gull-alert-banner"
          role="alert"
        >
          <div className="tally-banner flex w-full flex-col items-center gap-3 bg-gradient-to-r from-transparent via-background/75 to-transparent py-7">
            {/* Color por estilo y no por clase: `ALERT_RED` es una constante de
                la escena, no un token del sistema de diseño de la web. */}
            <span
              className="tally-banner-title font-mono text-5xl font-bold uppercase leading-none tracking-[0.35em]"
              style={{ color: ALERT_RED }}
            >
              {t.game.tally.alert}
            </span>
            <span className="tally-banner-sub font-mono text-xs font-semibold uppercase tracking-[0.5em] text-foreground">
              {t.game.tally.alertSub}
            </span>
          </div>
        </div>
      )}

      {alert && (
        <div
          aria-hidden
          className="alert-vignette pointer-events-none absolute inset-0 z-20"
          data-testid="gull-alert-vignette"
          style={{ backgroundImage: VIGNETTE }}
        />
      )}

      {cracks.map((c) => {
        // Escala hasta la diagonal completa: desde cualquier punto de impacto,
        // el radio 100 del dibujo alcanza la esquina más lejana.
        const k = Math.hypot(c.w, c.h) / CRACK_RADIUS;
        const place = `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${k.toFixed(3)})`;
        return (
          <div
            key={c.id}
            aria-hidden
            className="crack pointer-events-none absolute inset-0 z-20"
            data-testid="screen-crack"
            style={{ animationDuration: `${CRACK_MS}ms` }}
          >
            <span
              className="crack-flash"
              style={{ left: `${c.x.toFixed(1)}px`, top: `${c.y.toFixed(1)}px` }}
            />
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${c.w} ${c.h}`}
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Dos pasadas sobre el mismo trazo: la oscura hace de sombra del
                  corte y la clara, del filo. Así la grieta se lee sobre cielo
                  claro y sobre agua oscura sin cambiar de color. El grosor va
                  dividido por la escala para que no engorde con la pantalla. */}
              {[
                { stroke: "rgba(0,0,0,0.5)", base: STROKE_INK },
                { stroke: "rgba(255,255,255,0.92)", base: STROKE_EDGE },
              ].map((pass) => (
                <g key={pass.stroke} transform={place} stroke={pass.stroke} strokeLinecap="round">
                  {c.paths.map((p, i) => (
                    <path
                      key={i}
                      d={p.d}
                      pathLength={1}
                      strokeWidth={(pass.base * p.w) / k}
                      className="crack-line"
                      style={{ animationDelay: `${i * 6}ms` }}
                    />
                  ))}
                </g>
              ))}
            </svg>
          </div>
        );
      })}
    </>
  );
}
