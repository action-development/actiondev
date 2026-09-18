/**
 * Bus de entrada del mando de radiocontrol del hero (overlay DOM) hacia el
 * bucle de juego (`GameWorld.useFrame`).
 *
 * POR QUÉ UN SINGLETON DE REFS Y NO ESTADO DE REACT: el mando vive fuera del
 * `<Canvas>` (overlay DOM) y la grúa se mueve a 60 fps leyendo refs. Pasar la
 * pulsación por estado de React provocaría un re-render de toda la escena por
 * cada frame que el botón esté pulsado. Aquí se muta un objeto y el `useFrame`
 * lo lee, igual que `use-keyboard` / `use-action-queue`.
 *
 * `actions` es una COLA (contador), no un booleano: una pulsación corta puede
 * empezar y acabar entre dos frames — ver `use-action-queue`.
 */
export const remoteInput = {
  /** Mantener la flecha izquierda del mando. */
  left: false,
  /** Mantener la flecha derecha del mando. */
  right: false,
  /** Pulsaciones del botón de gancho pendientes de consumir. */
  actions: 0,
};

/** Suelta las pulsaciones (pausa del juego, pérdida de foco, desmontaje). */
export function resetRemoteInput() {
  remoteInput.left = false;
  remoteInput.right = false;
  remoteInput.actions = 0;
}
