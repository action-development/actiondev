"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

gsap.defaults({
  ease: "power3.out",
  duration: 0.8,
});

/**
 * `prefers-reduced-motion` para GSAP — WCAG 2.1 SC 2.3.3 (Animation from
 * Interactions).
 *
 * La regla global de `globals.css` solo alcanza a las animaciones y
 * transiciones CSS; los reveals de scroll de este sitio los hace GSAP, y GSAP
 * escribe estilos en línea que ninguna media query toca. Hasta ahora, con
 * "reducir movimiento" activado, el Footer, `/contact`, `/projects` y las
 * reseñas seguían entrando con su `y: 32` y su fundido completo.
 *
 * Se resuelve en el reloj y no tween a tween: acelerar la línea de tiempo
 * global x200 deja cada animación en ~4 ms, da igual la duración que le
 * hayan puesto en su sitio (0,9 s en `Contact`, 0,7 s en `Footer`…). Lo que
 * importa es que **el estado final sí se aplica**: los `gsap.from(..., {
 * opacity: 0 })` terminan, así que nada se queda invisible — que es el modo
 * en que este patrón suele romperse cuando se intenta desactivar a lo bruto.
 *
 * No afecta a Lenis: se mueve desde `gsap.ticker` (ver `hooks/use-lenis.ts`,
 * que ya lee esta misma media query por su cuenta), no desde un tween, y el
 * ticker no pasa por `globalTimeline`. En el árbol no hay ningún tween con
 * `repeat: -1` al que esto pudiera convertir en un parpadeo.
 *
 * Escucha `change`, así que cambiar la preferencia del sistema a media sesión
 * se aplica sin recargar.
 */
if (typeof window !== "undefined") {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply = () => gsap.globalTimeline.timeScale(reduced.matches ? 200 : 1);
  apply();
  reduced.addEventListener("change", apply);
}

export { gsap, ScrollTrigger };
