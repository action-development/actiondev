import { Inter } from "next/font/google";

/**
 * TITULARES — hueco de sustitución.
 *
 * La referencia usa **PP Neue Montreal** (Pangram Pangram), comercial.
 * Cuando exista la licencia: dejar el .woff2 en `public/fonts/`, declarar
 * un @font-face en globals.css y apuntar ahí `--font-display`. Es el
 * único cambio necesario — nada más depende de esta fuente.
 *
 * Hasta entonces, Inter 900 como sustituto libre: neo-grotesca de la
 * misma familia visual, aunque sin el carácter de la original.
 */
export const displayFont = Inter({
  variable: "--font-display-stand-in",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});
