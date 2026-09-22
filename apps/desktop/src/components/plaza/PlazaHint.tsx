import { ControlSign } from "@/components/ui/ControlSign";

interface PlazaHintProps {
  /** Se pinta hasta que el visitante abre su primera ficha. */
  visible: boolean;
  /** Texto ya traducido — el componente no sabe de i18n. */
  label: string;
}

/**
 * Pista de click de /resenas: el MISMO cartel del tutorial del hero
 * (`ui/ControlSign`), arriba y centrado como allí, con una sola tapa: el
 * cursor. Aquí no hay pasos ni LEDs de progreso — es un gesto único.
 *
 * Es solo lectura: hereda `pointer-events-none` del HUD, así que no roba
 * clicks ni arrastres a los muñecos que tiene detrás.
 */
export function PlazaHint({ visible, label }: PlazaHintProps) {
  return (
    <div
      data-testid="plaza-hint"
      data-visible={visible}
      aria-hidden={!visible}
      className={`transition-opacity ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <ControlSign
        action={label}
        keys={[
          {
            label: (
              <svg width="15" height="15" viewBox="0 0 16 16">
                <path
                  d="M3 2 L3 13.5 L6.2 10.6 L8.1 14.6 L10.2 13.6 L8.3 9.8 L12.5 9.4 Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          },
        ]}
      />
    </div>
  );
}
