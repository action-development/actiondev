/**
 * Precarga del código de las escenas 3D, por ruta.
 *
 * Cada escena se monta con `dynamic(..., { ssr: false })`, así que su chunk
 * (y three.js, si se viene de una página sin 3D) no se pedía hasta que la ruta
 * nueva ya se había montado, es decir, DESPUÉS de cerrarse la persiana. Desde
 * el blog, una landing o una ficha eran ~0,5 s extra en 4G con la pantalla en
 * lima (auditoría de cargas 2026-10). `PageTransition` llama a
 * `preloadScene()` al apuntar o enfocar un enlace y al empezar a navegar: el
 * chunk baja mientras la persiana se cierra.
 *
 * Los loaders de aquí son el ÚNICO sitio con el `import()` de cada escena: las
 * páginas los usan en su `dynamic()`. Con dos `import()` del mismo módulo
 * (uno aquí y otro en la página) Turbopack genera dos grupos de chunks, y la
 * página aún pedía su chunk de entrada tras montar. Ruta 3D nueva → loader
 * aquí, entrada en `SCENES` y su página con `dynamic(() => loadX().then(...))`.
 */
export const loadGameScene = () => import("@/components/canvas/GameScene");
export const loadArcadeScene = () => import("@/components/canvas/ArcadeScene");
export const loadPlazaScene = () => import("@/components/canvas/PlazaScene");
export const loadStreetScene = () => import("@/components/canvas/StreetScene");

const SCENES: Record<string, () => Promise<unknown>> = {
  // GameScene ya arrastra Rapier (2,2 MB): `@react-three/rapier` lo importa
  // estático y cae en el mismo grupo de chunks.
  "/": loadGameScene,
  "/projects": loadArcadeScene,
  "/resenas": loadPlazaScene,
  "/contact": loadStreetScene,
};

const started = new Set<string>();

/**
 * La home de escritorio solo la ven los dispositivos con ratón: en un móvil el
 * middleware manda `/` a la zona mobile y GameScene + Rapier (~1,1 MB gz) se
 * bajarían para nada. Tampoco si el visitante ha pedido ahorrar datos.
 */
function homeIsWorthIt(): boolean {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !saveData && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Empieza a bajar la escena de `pathname`, si tiene. Idempotente y sin esperar. */
export function preloadScene(pathname: string): void {
  const load = SCENES[pathname];
  if (!load || started.has(pathname)) return;
  // Sin red, nada: el runtime de Turbopack guarda el fallo de un chunk hasta
  // la siguiente carga completa, y la ruta ya no podría pedirlo de nuevo.
  if (!navigator.onLine) return;
  if (pathname === "/" && !homeIsWorthIt()) return;
  started.add(pathname);
  load().catch(() => {});
}
