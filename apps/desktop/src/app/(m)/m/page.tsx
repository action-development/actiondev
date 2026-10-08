import type { Metadata } from "next";
import { HomeCases } from "@/components/m/home/HomeCases";
import { HomeFinalCta, HomeZones } from "@/components/m/home/HomeClosing";
import { HomeFaq } from "@/components/m/home/HomeFaq";
import { HomeHero } from "@/components/m/home/HomeHero";
import { HomeReviews } from "@/components/m/home/HomeReviews";
import { HomeProcess, HomeServices } from "@/components/m/home/HomeServices";
import { HOME_FINAL_CTA_ID, HOME_HERO_CTA_ID, HOME_WHATSAPP_TEXT } from "@/components/m/home/home-data";
import { MobileFooter } from "@/components/m/MobileFooter";
import { MobileHeader } from "@/components/m/MobileHeader";
import { StickyCta } from "@/components/m/StickyCta";
import { ROOT_METADATA } from "@/lib/site-metadata";

/**
 * Home de la web móvil v2 (`/` con UA móvil + flag; maqueta aprobada
 * `docs/mobile-v2/home.html`). Server component: solo la cabecera (menú), la
 * barra fija y el banner de cookies llevan JS.
 *
 * SEO (paridad con la home de escritorio, por construcción): `<title>`,
 * description, Open Graph y robots salen de `ROOT_METADATA` vía el layout
 * móvil; el canonical es el MISMO objeto que declara el escritorio (`/` →
 * `https://actiondev.es`) y el JSON-LD Organization + WebSite lo emite el
 * layout. Un único `<h1>` (el del hero). Los enlaces que la home anterior
 * escondía con `sr-only` —`/servicios`, las 10 landings, `/projects`,
 * `/resenas`, `/blog`, `/contact` y legales— están todos, visibles.
 *
 * «Contar mi proyecto» lleva a `/contact` (el formulario), no a un paso 1
 * incrustado: la home sigue sin JS de formulario (ni `useLeadForm` ni
 * validación en el bundle de la URL con más tráfico), tiene un solo destino
 * de conversión que medir y el formulario vive en una sola página.
 */
export const metadata: Metadata = {
  alternates: ROOT_METADATA.alternates,
};

export default function MobileHomePage() {
  return (
    <>
      <MobileHeader whatsappText={HOME_WHATSAPP_TEXT} />
      <main id="main-content">
        <HomeHero />
        <HomeCases />
        <HomeReviews />
        <HomeServices />
        <HomeProcess />
        <HomeFaq />
        <HomeFinalCta />
        <HomeZones />
      </main>
      <MobileFooter whatsappText={HOME_WHATSAPP_TEXT} />
      {/* Aparece al salir el CTA del hero; se esconde con el CTA final a la vista (mismos botones). */}
      <StickyCta heroId={HOME_HERO_CTA_ID} formId={HOME_FINAL_CTA_ID} whatsappText={HOME_WHATSAPP_TEXT} />
    </>
  );
}
