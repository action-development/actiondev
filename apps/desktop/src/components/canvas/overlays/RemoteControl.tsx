"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { remoteInput, resetRemoteInput } from "@/lib/hero-remote";
import { ACTION_KEYS } from "@/hooks/use-action-queue";
import { useT } from "@/lib/i18n";
import styles from "./RemoteControl.module.css";

type Key = "left" | "right" | "hook";

/** Cuánto dura el "mantener pulsado" simulado de una activación por teclado. */
const KEYBOARD_HOLD_MS = 260;

const NO_KEYS: Record<Key, boolean> = { left: false, right: false, hook: false };

/** Tecla física → botón del mando que se ilumina (mismas teclas que `GameWorld`). */
function keyToButton(code: string): Key | null {
  if (code === "KeyA" || code === "ArrowLeft") return "left";
  if (code === "KeyD" || code === "ArrowRight") return "right";
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
export function RemoteControl() {
  const t = useT();
  const [pressed, setPressed] = useState<Record<Key, boolean>>(NO_KEYS);
  // Teclas físicas mantenidas: SOLO visual. El teclado ya mueve la grúa por su
  // cuenta (`use-keyboard` / `use-action-queue`); escribir aquí en
  // `remoteInput` duplicaría cada acción.
  const [keyHeld, setKeyHeld] = useState<Record<Key, boolean>>(NO_KEYS);
  const holdTimers = useRef<Partial<Record<Key, ReturnType<typeof setTimeout>>>>({});

  const release = useCallback((key: Key) => {
    if (key !== "hook") remoteInput[key] = false;
    setPressed((p) => (p[key] ? { ...p, [key]: false } : p));
  }, []);

  const press = useCallback((key: Key, e?: React.PointerEvent) => {
    // Capturar el puntero: así el botón sigue recibiendo `pointerup` aunque se
    // arrastre fuera, y no hace falta escuchar `pointerleave` (que se disparaba
    // solo al hundirse la tapa dentro del padre en perspectiva).
    e?.currentTarget.setPointerCapture?.(e.pointerId);
    if (key === "hook") remoteInput.actions++;
    else remoteInput[key] = true;
    setPressed((p) => ({ ...p, [key]: true }));
  }, []);

  // Soltar también si el puntero se levanta fuera del botón: sin esto, arrastrar
  // desde la flecha y soltar sobre el cielo deja el carro corriendo para siempre.
  // Espejo del teclado: A/D/←/→ hunden las flechas, Espacio/E/S/↓ el gancho.
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
      setPressed({ left: false, right: false, hook: false });
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

  const arrowProps = (key: "left" | "right") => ({
    type: "button" as const,
    className: `${styles.btn} ${styles.arrow}`,
    "data-pressed": isDown(key),
    "data-testid": `remote-${key}`,
    "aria-label": key === "left" ? t.game.remote.left : t.game.remote.right,
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

          {/* Flechas: mueven el carro de la grúa mientras se mantengan */}
          <div className="flex items-center gap-2">
            <button {...arrowProps("left")}>
              <span className={styles.key}>
                <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <button {...arrowProps("right")}>
              <span className={styles.key}>
                <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
              {t.game.remote.lower}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
