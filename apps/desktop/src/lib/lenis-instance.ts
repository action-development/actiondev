import type Lenis from "lenis";

/**
 * La instancia viva de Lenis (la crea `useLenis` en las páginas con
 * `SmoothScroll`), en un módulo aparte del hook.
 *
 * Quien solo necesita LEERLA —el Header, para volver arriba al pulsar el
 * logo— importa de aquí y no de `hooks/use-lenis`: ese hook trae Lenis, GSAP y
 * ScrollTrigger (~46 KB gz), y como el Header está en casi todas las rutas,
 * acababan en las escenas 3D y en el blog, que no usan ninguno de los tres.
 * El `import type` se borra al compilar: este módulo no arrastra nada.
 */
let instance: Lenis | null = null;

export const getLenis = (): Lenis | null => instance;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}
