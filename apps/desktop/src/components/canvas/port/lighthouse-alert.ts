/**
 * Easter egg — "Alerta del faro" (lógica pura).
 *
 * Un click SOBRE el faro de Cíes enfurece al puerto: las gaviotas sacan los
 * ojos rojos, entra un enjambre extra y el haz gira en rojo a
 * `ALERT_BEAM_SPIN` veces su velocidad. A los `DIVE_FIRST` segundos UNA sola
 * se lanza CONTRA LA PANTALLA, la deja agrietada de lado a lado — y ahí se
 * acaba la alerta: el choque es el final, no un episodio más.
 *
 * NO es una mecánica de juego y no se cruza con la caza de gaviotas: no da
 * puntos, no abre ronda y mientras dura NO se puede disparar (lo corta el
 * interceptor de `GameWorld`). Es una escena, y se mira.
 *
 * Aquí vive lo testeable: el hit-test del faro, el reparto de turnos de la
 * embestida y el dibujo de la grieta. El render está repartido entre
 * `Seagulls.tsx` (ojos y picado), `LighthouseBeam.tsx` (haz) y el overlay DOM
 * `overlays/AlertOverlay.tsx`, que además lleva el reloj.
 */

/** Estado compartido de la alerta: lo escribe `GullTally`, lo leen las aves y el faro. */
export interface GullAlert {
  active: boolean;
  /**
   * Reloj de escena (s) a partir del cual la próxima gaviota puede embestir.
   * Hace de turno: la primera que lo ve lo reserva (`claimDive`), así no se
   * lanzan todas a la vez sin necesidad de un coordinador central.
   */
  nextDiveAt: number;
}

/**
 * Tope de la alerta. Normalmente NO se llega: la alerta muere en cuanto la
 * gaviota se estrella (`AlertOverlay` escucha el impacto). Es la red de
 * seguridad para el caso en que ninguna pueda embestir — todas posadas.
 */
export const ALERT_SECONDS = 10;

/** El haz del faro gira esto de rápido durante la alerta (y en rojo). */
export const ALERT_BEAM_SPIN = 3;

/**
 * Rojo de alarma: haz, linterna, ojos y viñeteado de pantalla.
 *
 * Se guarda por COMPONENTES y el hex se deriva. El CSS necesita poder darle
 * alfa (`rgb(var(--alert-rgb) / .3)`) y `color-mix(…, transparent)` no sirve:
 * interpola hacia el NEGRO, así que el viñeteado salía gris sucio en vez de
 * rojo. Three.js, en cambio, quiere el hex.
 */
export const ALERT_RGB = [255, 42, 24] as const;
export const ALERT_RED = `#${ALERT_RGB.map((n) => n.toString(16).padStart(2, "0")).join("")}`;



/* ------------------------------ Hit-test ------------------------------ */

/**
 * Altura sobre `LIGHTHOUSE` del centro del blanco: la torre mide ~2,9 y lo que
 * se pincha es su mitad, no la base.
 */
export const LIGHTHOUSE_LIFT = 1.7;

/** Radio del blanco en unidades de mundo (torre + linterna con margen). */
export const LIGHTHOUSE_RADIUS = 2.2;

/**
 * Tolerancia ANGULAR (radianes). El faro está a ~146 u de la cámara: con su
 * radio real serían 18 px de diana. Mismo truco que `AIM_SLACK` en la caza de
 * gaviotas — a esa distancia esto da una diana de ~25 px.
 */
export const LIGHTHOUSE_SLACK = 0.022;

/**
 * ¿El rayo (origen + dirección unitaria) acierta al faro? Se comprueba
 * DESPUÉS de contenedores y grúa: lo que está delante gana.
 */
export function pickLighthouseAt(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  pos: readonly [number, number, number],
  slack = LIGHTHOUSE_SLACK,
): boolean {
  const px = pos[0];
  const py = pos[1] + LIGHTHOUSE_LIFT;
  const pz = pos[2];
  const t = (px - ox) * dx + (py - oy) * dy + (pz - oz) * dz;
  // Lo que queda detrás de la cámara no se pincha.
  if (t <= 0) return false;
  const cx = ox + dx * t - px;
  const cy = oy + dy * t - py;
  const cz = oz + dz * t - pz;
  const reach = Math.max(LIGHTHOUSE_RADIUS, t * slack);
  return cx * cx + cy * cy + cz * cz <= reach * reach;
}

/* ----------------------------- Embestidas ----------------------------- */

/**
 * Retraso (s desde que se abre la alerta) con el que entra cada gaviota del
 * enjambre. Más corto que el de la ronda (`rushStagger`): la alerta tiene que
 * llenar el cielo casi de golpe, pero no todas en el mismo frame.
 *
 * El módulo es PRIMO CON 5 a propósito. Los seeds del enjambre van de 5 en 5
 * (`200 + i*5 + 3`), así que con `% 5` todas caían en el mismo resto y entraban
 * las seis a la vez — lo pilló el test de escalonado.
 */
export function alertStagger(seed: number): number {
  return 0.15 + (seed % 7) * 0.16;
}

/**
 * Respiro antes de la embestida. Es el tiempo que dura la alerta "en calma":
 * lo justo para ver llegar al enjambre y fijarse en los ojos rojos antes de
 * que una se venga encima.
 */
export const DIVE_FIRST = 3;
/**
 * Probabilidad por frame de que un ave elegible intente quedarse el turno.
 * Sin esto ganaría SIEMPRE la primera en orden de render (y nunca una del
 * enjambre); con la tirada sale una cualquiera de las que vuelan y el turno se
 * resuelve igual en un par de frames.
 */
export const DIVE_PICK = 0.2;
/** Lo que tarda el picado de la gaviota, de su órbita a la cámara. */
export const DIVE_TIME = 1.15;
/** Distancia a la cámara del punto de impacto (u). */
export const DIVE_DEPTH = 3;
/** Escala del ave al estrellarse: llena media pantalla. */
export const DIVE_SCALE = 2.6;

/**
 * ¿Le toca embestir a esta gaviota? Reserva el turno mutando `alert` — es
 * deliberado: el objeto compartido ES el semáforo entre las aves, que corren
 * cada una en su propio `useFrame` sin saber nada de las demás.
 *
 * El turno es ÚNICO por alerta: la que lo coge cierra la puerta a las demás
 * para siempre (`Infinity`). Sólo se estrella una gaviota, y con ella acaba
 * el easter egg.
 */
export function claimDive(alert: GullAlert, clock: number): boolean {
  if (!alert.active) return false;
  // Alerta recién abierta (`nextDiveAt` a 0, que lo deja `setAlert`): la
  // primera ave que mira pone el reloj en hora. Quien abre la alerta es el
  // DOM y no conoce el reloj de la escena, así que se fija aquí.
  if (alert.nextDiveAt === 0) {
    alert.nextDiveAt = clock + DIVE_FIRST;
    return false;
  }
  if (clock < alert.nextDiveAt) return false;
  alert.nextDiveAt = Number.POSITIVE_INFINITY;
  return true;
}

/* ------------------------------- Grieta ------------------------------- */

/**
 * PRNG local (mulberry32) para que cada grieta sea distinta pero reproducible
 * a partir de un número. No se reutiliza el de `plaza-config.ts` a propósito:
 * aquel siembra con el id de un testimonio y acoplar las dos escenas por un
 * generador de 8 líneas no compensa.
 */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Radio del dibujo en su propio sistema de coordenadas. NO son píxeles: el
 * overlay escala la grieta hasta la diagonal de la ventana, así que una rama
 * de radio 100 llega a la esquina más lejana desde donde sea que pegue el ave.
 */
export const CRACK_RADIUS = 100;
/** Ramas principales que salen del impacto. */
const BRANCHES = 14;
/** Arcos sueltos que cosen ramas vecinas. */
const ARCS = 13;
/** Astillas cortísimas en el punto exacto del golpe. */
const SHARDS = 6;

/**
 * Grosor relativo de cada tipo de trazo. La grieta se lee por la jerarquía:
 * gorda donde pegó el ave y cada vez más fina al alejarse.
 */
const SHARD_W = 1.3;
const TRUNK_W = 1;
const TIP_W = 0.6;
const ARC_W = 0.45;
const SPLINTER_W = 0.4;

/** Un trazo de la grieta. */
export interface CrackStroke {
  /** Atributo `d` del `<path>`. */
  d: string;
  /** Grosor RELATIVO (1 = trazo principal junto al impacto). */
  w: number;
}

type Point = [number, number];

const poly = (pts: Point[]) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : " L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/**
 * Grieta de cristal a pantalla completa. Tres cosas la separan de una
 * telaraña, que es en lo que se queda si se dibuja a lo bruto:
 *
 * 1. Las ramas ADELGAZAN: cada una va en dos trazos, grueso junto al golpe y
 *    fino en la punta. El vidrio se abre donde pega y se cierra al alejarse.
 * 2. Los aros son ARCOS SUELTOS entre ramas vecinas, no anillos cerrados. Un
 *    aro entero de lado a lado es exactamente lo que dibuja una araña.
 * 3. Hay una estrella de astillas en el punto del impacto.
 *
 * Coordenadas centradas en (0, 0), de -100 a 100. Los trazos se dibujan con
 * `pathLength="1"`, así que quien anima no necesita medir nada.
 */
export function crackPaths(seed: number): CrackStroke[] {
  const rand = rng(seed);
  const out: CrackStroke[] = [];
  const tips: Point[] = [];
  const step = (Math.PI * 2) / BRANCHES;

  for (let i = 0; i < BRANCHES; i++) {
    // Ángulo repartido con jitter: radial de verdad, no un abanico regular.
    const a = i * step + (rand() - 0.5) * step * 0.85;
    // Todas largas: la grieta tiene que salirse del encuadre por los cuatro
    // lados, no quedarse en una mancha en mitad de la pantalla.
    const len = CRACK_RADIUS * (0.62 + rand() * 0.38);
    const segments = 4 + Math.floor(rand() * 3);
    const pts: Point[] = [[0, 0]];
    for (let s = 1; s <= segments; s++) {
      // Cada tramo se desvía un poco del anterior: el vidrio no parte recto.
      const wobble = (rand() - 0.5) * 0.55;
      const r = (len * s) / segments;
      pts.push([Math.cos(a + wobble) * r, Math.sin(a + wobble) * r]);
      // Astillas laterales: cuelgan de los tramos de fuera, que es donde el
      // vidrio tiene sitio para seguir abriéndose.
      if (s >= 2 && s < segments && rand() > 0.5) {
        const [x, y] = pts[s];
        const b = a + (rand() > 0.5 ? 1 : -1) * (0.45 + rand() * 0.55);
        const br = r * (0.3 + rand() * 0.45);
        out.push({ d: poly([[x, y], [x + Math.cos(b) * br, y + Math.sin(b) * br]]), w: SPLINTER_W });
      }
    }
    // Mitad de dentro gruesa, mitad de fuera fina (comparten vértice: sin hueco).
    const mid = Math.ceil(segments / 2);
    out.push({ d: poly(pts.slice(0, mid + 1)), w: TRUNK_W });
    out.push({ d: poly(pts.slice(mid)), w: TIP_W });
    tips.push(pts[pts.length - 1]);
  }

  // Arcos entre ramas vecinas, a alturas distintas y sin cerrar.
  for (let n = 0; n < ARCS; n++) {
    const from = Math.floor(rand() * BRANCHES);
    const span = 2 + Math.floor(rand() * 3);
    const k = 0.18 + rand() * 0.55;
    const pts: Point[] = [];
    for (let j = 0; j <= span; j++) {
      const [tx, ty] = tips[(from + j) % BRANCHES];
      const jitter = k * (0.85 + rand() * 0.3);
      pts.push([tx * jitter, ty * jitter]);
    }
    out.push({ d: poly(pts), w: ARC_W });
  }

  // Estrella del golpe: donde el cristal se hace polvo.
  for (let n = 0; n < SHARDS; n++) {
    const a = rand() * Math.PI * 2;
    const r = CRACK_RADIUS * (0.02 + rand() * 0.05);
    out.push({ d: poly([[0, 0], [Math.cos(a) * r, Math.sin(a) * r]]), w: SHARD_W });
  }

  return out;
}
