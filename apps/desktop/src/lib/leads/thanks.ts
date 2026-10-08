import type { Metadata } from "next";
import { LEAD_NEEDS, projects, type LeadNeed, type Project } from "@actiondev/shared";
import { NEED_PHRASE } from "./whatsapp";

/**
 * Confirmación de un lead (`/hablemos/gracias?tipo=app`): metadatos, tipo
 * validado, mensaje de WhatsApp y casos. Fuente ÚNICA para la página de
 * escritorio y la móvil. Extraído sin cambios de la página de escritorio.
 *
 * NO mide nada: la conversión (`generate_lead`) sale del formulario con el
 * lead ya guardado — medirla al cargar contaría cada recarga o enlace
 * compartido como un lead más.
 */

export const THANKS_METADATA: Metadata = {
  title: "Proyecto recibido",
  alternates: { canonical: "/hablemos/gracias" },
  robots: { index: false, follow: true },
};

const CASES_BY_NEED: Record<LeadNeed, string[]> = {
  app: ["autoescuela-gti", "true-trading-app"],
  software: ["autoescuela-gti", "timetracker"],
  integration: ["nautirent", "autoescuela-gti"],
  web: ["musa", "nautirent"],
  unsure: ["autoescuela-gti", "true-trading-app"],
};

function isLeadNeed(value: string | undefined): value is LeadNeed {
  return !!value && (LEAD_NEEDS as readonly string[]).includes(value);
}

/** `?tipo=` validado contra la unión: cualquier otra cosa se ignora. */
export function thanksNeed(tipo: string | string[] | undefined): LeadNeed | undefined {
  const raw = Array.isArray(tipo) ? tipo[0] : tipo;
  return isLeadNeed(raw) ? raw : undefined;
}

/** Mensaje de WhatsApp: sin datos personales en la URL, solo el tipo de proyecto. */
export function thanksWhatsappText(need: LeadNeed | undefined): string {
  const phrase = need ? NEED_PHRASE[need] : null;
  return `Hola, acabo de enviar mi proyecto${phrase ? ` de ${phrase}` : ""} desde la web`;
}

/** Casos del tipo de proyecto («Mientras tanto, mira lo que ya hemos hecho»). */
export function thanksCases(need: LeadNeed | undefined): Project[] {
  return (CASES_BY_NEED[need ?? "unsure"] ?? []).flatMap((slug) => {
    const project = projects.find((p) => p.slug === slug);
    return project ? [project] : [];
  });
}
