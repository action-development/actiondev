"use client";

import { useEffect, type RefObject } from "react";
import { track } from "@actiondev/shared";

/**
 * `whatsapp_click` con `link_location`: DESDE QUÉ enlace de WhatsApp se abre
 * cada chat (cabecera, paso 1 del formulario, barra fija, cierre, pie,
 * gracias…), para saber si alguno canibaliza el formulario. Sin datos
 * personales: `link_location` es el `data-testid` del enlace (o su
 * `data-link-location`, si lo lleva) y `page_path` va sin query. Sale por
 * `track()` de shared: solo con consentimiento `granted`.
 *
 * NO sustituye a `click_whatsapp` (`listenContactClicks` de shared), que es la
 * conversión secundaria de Google Ads y no cambia ni de nombre ni de
 * parámetros: un clic empuja los dos eventos.
 *
 * Un solo listener de captura en el documento para todas las zonas que se
 * registran: la página entera en `/hablemos/*` (`WhatsappClickTracking` en
 * sus layouts) y el propio formulario allí donde se monte (landings SEO,
 * `/contact` móvil). Si un enlace cae en dos zonas, cuenta una vez.
 */

const WHATSAPP_LINK = 'a[href^="https://wa.me/"]';

/** Zonas registradas → nº de montajes (dos formularios en la misma página no se pisan). */
const zones = new Map<Node, number>();

/** Identificador estable del enlace para el informe. */
export function whatsappLinkLocation(anchor: HTMLElement): string {
  return anchor.dataset.linkLocation || anchor.dataset.testid || "sin-identificar";
}

function onClick(event: MouseEvent) {
  const anchor = (event.target as Element | null)?.closest?.(WHATSAPP_LINK);
  if (!(anchor instanceof HTMLElement)) return;
  for (const zone of zones.keys()) {
    if (zone === document || zone.contains(anchor)) {
      track("whatsapp_click", { link_location: whatsappLinkLocation(anchor), page_path: window.location.pathname });
      return;
    }
  }
}

function watch(zone: Node): () => void {
  if (zones.size === 0) document.addEventListener("click", onClick, true);
  zones.set(zone, (zones.get(zone) ?? 0) + 1);
  return () => {
    const left = (zones.get(zone) ?? 1) - 1;
    if (left > 0) zones.set(zone, left);
    else zones.delete(zone);
    if (zones.size === 0) document.removeEventListener("click", onClick, true);
  };
}

/** Mide los clics en WhatsApp dentro de `ref` (el formulario) o, sin `ref`, en toda la página. */
export function useWhatsappClickTracking(ref?: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const zone = ref ? ref.current : document;
    return zone ? watch(zone) : undefined;
  }, [ref]);
}

/** Para los layouts (server) de `/hablemos/*`: mide todos los enlaces de WhatsApp de la página. */
export function WhatsappClickTracking(): null {
  useWhatsappClickTracking();
  return null;
}
