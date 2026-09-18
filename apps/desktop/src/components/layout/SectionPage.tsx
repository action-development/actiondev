"use client";

import { SmoothScroll } from "@/components/animations/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Shell de las páginas que antes eran secciones de la home (`/projects`,
 * `/contact`). Reproduce el entorno exacto en el que esas secciones se
 * diseñaron — Lenis + Header fijo + Footer — para que sus ScrollTriggers y
 * reveals funcionen tal cual, sin adaptarlas. La home ("La Grúa") NO usa este
 * shell: es pantalla completa sin scroll.
 */
export function SectionPage({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
