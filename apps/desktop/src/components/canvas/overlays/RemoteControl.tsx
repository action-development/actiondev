"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { remoteInput, resetRemoteInput } from "@/lib/hero-remote";
import { ACTION_KEYS } from "@/hooks/use-action-queue";
import type { GameState } from "@/hooks/use-game-state";
import { QUAY_ROWS, SHIP_ROW } from "../port/quay-rows";
import { useT } from "@/lib/i18n";
import styles from "./RemoteControl.module.css";

/**
 * Botones del mando. `left` / `right` se MANTIENEN (mueven el carro mientras
 * se pulsan); `up` / `down` (fila del muelle) y `hook` son PULSOS: encolan una
 * acción y se acabó.
 */
type Key = "left" | "right" | "up" | "down" | "hook";

/** Cuánto dura el "mantener pulsado" simulado de una activación por teclado. */
const KEYBOARD_HOLD_MS = 260;

const NO_KEYS: Record<Key, boolean> = { left: false, right: false, up: false, down: false, hook: false };

/** Tecla física impresa en cada flecha: el mando hace de leyenda del teclado. */
const KEY_LETTER: Record<"left" | "right" | "up" | "down", string> = { left: "A", right: "D", up: "W", down: "S" };

/**
 * Filas del indicador, de ARRIBA abajo como la cruceta: ▲ aleja (fondo, índice
 * alto) y ▼ acerca (delante, índice 0).
 */
const ROW_PIPS = QUAY_ROWS.map((_, i) => QUAY_ROWS.length - 1 - i);

/** Tecla física → botón del mando que se ilumina (mismas teclas que `GameWorld`). */
function keyToButton(code: string): Key | null {
  if (code === "KeyA" || code === "ArrowLeft") return "left";
  if (code === "KeyD" || code === "ArrowRight") return "right";
  if (code === "KeyW" || code === "ArrowUp") return "up";
  if (code === "KeyS" || code === "ArrowDown") return "down";
  if (ACTION_KEYS.has(code)) return "hook";
  return null;
}

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/**
 * Mando de radiocontrol del hero: overlay DOM (NO va dentro del `<Canvas>`).
 *
 * POR QUÉ FUERA DEL CANVAS:
 * 1. `use-action-queue` cuenta CUALQUIER `mousedown` sobre el canvas como
 *    "bajar el gancho"; un mando dibujado dentro dispararía la acción también
 *    al tocar las flechas.
 * 2. Todo lo que se monte dentro del `<Suspense>` de `GameScene` retrasa
 *    `onReady` y con ello la pantalla de carga.
 *
 * La caja es CSS 3D real (ver `RemoteControl.module.css`). Los botones escriben en
 * `remoteInput`, que `GameWorld.useFrame` lee igual que el teclado.
 */
export function RemoteControl({ gameState }: { gameState: GameState }) {
  const t = useT();
  // Fila del pórtico: GameWorld avisa solo al cambiar (nunca por frame).
  const [row, setRow] = useState(SHIP_ROW);
  useEffect(() => {
    gameState.onRow.current = setRow;
    return () => {
      gameState.onRow.current = null;
    };
  }, [gameState]);
  const [pressed, setPressed] = useState<Record<Key, boolean>>(NO_KEYS);
  // Teclas físicas mantenidas: SOLO visual. El teclado ya mueve la grúa por su
  // cuenta (`use-keyboard` / `use-action-queue`); escribir aquí en
  // `remoteInput` duplicaría cada acción.
  const [keyHeld, setKeyHeld] = useState<Record<Key, boolean>>(NO_KEYS);
  const holdTimers = useRef<Partial<Record<Key, ReturnType<typeof setTimeout>>>>({});

  const release = useCallback((key: Key) => {
    if (key === "left" || key === "right") remoteInput[key] = false;
    setPressed((p) => (p[key] ? { ...p, [key]: false } : p));
  }, []);

  const press = useCallback((key: Key, e?: React.PointerEvent) => {
    // Capturar el puntero: así el botón sigue recibiendo `pointerup` aunque se
    // arrastre fuera, y no hace falta escuchar `pointerleave` (que se disparaba
    // solo al hundirse la tapa dentro del padre en perspectiva).
    e?.currentTarget.setPointerCapture?.(e.pointerId);
    if (key === "hook") remoteInput.actions++;
    // Cambio de fila: pulso con signo, no "mantener". ▲ aleja, ▼ acerca.
    else if (key === "up") remoteInput.rowDelta++;
    else if (key === "down") remoteInput.rowDelta--;
    else remoteInput[key] = true;
    setPressed((p) => ({ ...p, [key]: true }));
  }, []);

  // Soltar también si el puntero se levanta fuera del botón: sin esto, arrastrar
  // desde la flecha y soltar sobre el cielo deja el carro corriendo para siempre.
  // Espejo del teclado: A/D/←/→ hunden las flechas de carro, W/S/↑/↓ las de
  // fila y Espacio/E el gancho.
  useEffect(() => {
    const set = (e: KeyboardEvent, down: boolean) => {
      const key = keyToButton(e.code);
      if (!key || isTypingTarget(e.target)) return;
      setKeyHeld((k) => (k[key] === down ? k : { ...k, [key]: down }));
    };
    const onDown = (e: KeyboardEvent) => set(e, true);
    const onUp = (e: KeyboardEvent) => set(e, false);
    const clear = () => setKeyHeld(NO_KEYS);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useEffect(() => {
    const timers = holdTimers.current;
    const releaseAll = () => {
      resetRemoteInput();
      setPressed(NO_KEYS);
    };
    window.addEventListener("pointerup", releaseAll);
    window.addEventListener("pointercancel", releaseAll);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("pointerup", releaseAll);
      window.removeEventListener("pointercancel", releaseAll);
      window.removeEventListener("blur", releaseAll);
      for (const timer of Object.values(timers)) clearTimeout(timer);
      resetRemoteInput();
    };
  }, []);

  /**
   * Activación por teclado (Enter / Espacio sobre el botón enfocado): `detail`
   * es 0 sólo en ese caso, así no se duplica la pulsación del ratón. Se mantiene
   * el pulso unos ms para que el carro se mueva algo perceptible.
   */
  const handleClick = useCallback((key: Key) => (e: React.MouseEvent) => {
    if (e.detail !== 0) return;
    press(key);
    clearTimeout(holdTimers.current[key]);
    holdTimers.current[key] = setTimeout(() => release(key), KEYBOARD_HOLD_MS);
  }, [press, release]);

  const isDown = (key: Key) => pressed[key] || keyHeld[key];

  const ARROW_LABELS: Record<"left" | "right" | "up" | "down", string> = {
    left: t.game.remote.left,
    right: t.game.remote.right,
    up: t.game.remote.up,
    down: t.game.remote.down,
  };

  const arrowProps = (key: "left" | "right" | "up" | "down") => ({
    type: "button" as const,
    className: `${styles.btn} ${styles.arrow}`,
    "data-pressed": isDown(key),
    "data-testid": `remote-${key}`,
    "aria-label": ARROW_LABELS[key],
    onPointerDown: (e: React.PointerEvent) => press(key, e),
    onPointerUp: () => release(key),
    onPointerCancel: () => release(key),
    onClick: handleClick(key),
  });

  // Inclinación del mando hacia el lado pulsado — sensación de mando físico:
  // rotateY negativo hunde el lado izquierdo (se aleja), positivo el derecho.
  const tiltY = isDown("left") ? -5 : isDown("right") ? 5 : 0;

  return (
    <div
      className={`${styles.stage} absolute bottom-4 left-1/2 z-40 -translate-x-1/2`}
      data-testid="hero-remote"
    >
      <div className={styles.body} style={{ ["--rc-ry" as string]: `${tiltY}deg` }}>
        <div className={`${styles.face} ${styles.back}`} />
        <div className={`${styles.face} ${styles.side} ${styles.left}`} />
        <div className={`${styles.face} ${styles.side} ${styles.right}`} />
        <div className={`${styles.face} ${styles.capFace} ${styles.top}`} />
        <div className={`${styles.face} ${styles.capFace} ${styles.bottom}`} />

        {/* Panel horizontal tipo arcade: flechas | marca | botón de acción */}
        <div className={`${styles.face} ${styles.front} flex items-center justify-between gap-3 px-4`}>
          <span aria-hidden className={styles.antenna} />

          {/* Cruceta en cruz (D-pad): ▲ arriba (fila del muelle, se aleja),
              ◀ ▶ a los lados (carro, se mantienen), ▼ abajo (se acerca). */}
          <div className={styles.pad}>
            <button {...arrowProps("up")} className={`${styles.btn} ${styles.arrow} ${styles.dpadUp}`}>
              <span className={styles.key}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span aria-hidden className={styles.keyHint}>{KEY_LETTER.up}</span>
              </span>
            </button>
            <button {...arrowProps("left")} className={`${styles.btn} ${styles.arrow} ${styles.dpadLeft}`}>
              <span className={styles.key}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span aria-hidden className={styles.keyHint}>{KEY_LETTER.left}</span>
              </span>
            </button>
            <span aria-hidden className={styles.hub} />
            <button {...arrowProps("right")} className={`${styles.btn} ${styles.arrow} ${styles.dpadRight}`}>
              <span className={styles.key}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span aria-hidden className={styles.keyHint}>{KEY_LETTER.right}</span>
              </span>
            </button>
            <button {...arrowProps("down")} className={`${styles.btn} ${styles.arrow} ${styles.dpadDown}`}>
              <span className={styles.key}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span aria-hidden className={styles.keyHint}>{KEY_LETTER.down}</span>
              </span>
            </button>
          </div>

          {/* Centro: marca + LED + rejilla, como un transmisor de verdad */}
          <div aria-hidden className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className={styles.led} />
              <span className="whitespace-nowrap font-mono text-[8px] font-bold tracking-[0.16em] text-[#d8d1bd]">
                {t.game.remote.model}
              </span>
            </div>
            {/* Indicador de fila: el pórtico en profundidad, con la del barco marcada. */}
            <div className={styles.rowMeter} data-testid="remote-row" data-row={row}>
              <span className="font-mono text-[7px] font-bold tracking-[0.16em] text-[#d8d1bd]">{t.game.remote.row}</span>
              <div className={styles.rowPips}>
                {ROW_PIPS.map((i) => (
                  <span key={i} className={styles.rowPip} data-on={i === row} data-ship={i === SHIP_ROW}>
                    {i === SHIP_ROW && (
                      <svg aria-hidden width="10" height="6" viewBox="0 0 10 6" className={styles.shipGlyph}>
                        <path d="M0 2h10L8.2 6H1.8Z" fill="currentColor" />
                        <rect x="5.6" y="0" width="1.6" height="2" fill="currentColor" />
                      </svg>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <span className={`${styles.grille} w-full`} />
          </div>

          {/* Botón de acción: baja el gancho / suelta el contenedor */}
          <button
            type="button"
            className={`${styles.btn} ${styles.hook}`}
            data-pressed={isDown("hook")}
            data-testid="remote-hook"
            aria-label={t.game.remote.hook}
            onPointerDown={(e) => press("hook", e)}
            onPointerUp={() => release("hook")}
            onPointerCancel={() => release("hook")}
            onClick={handleClick("hook")}
          >
            <span className={`${styles.key} font-mono text-[10px] font-bold tracking-[0.14em]`}>
              <span className="flex flex-col items-center gap-0.5 leading-none">
                {t.game.remote.lower}
                <span aria-hidden className="text-[6.5px] tracking-[0.12em] opacity-60">{t.game.remote.actionKey}</span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
