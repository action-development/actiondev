/**
 * Google Tag Manager + consentimiento de cookies.
 *
 * Fuente única para desktop y mobile: mismo contenedor GTM y misma clave de
 * almacenamiento, para que aceptar/rechazar en una zona no deje a la otra en
 * un estado inconsistente si algún día comparten dominio de verdad.
 */

export const GTM_ID = "GTM-PF295VK8";

export const CONSENT_STORAGE_KEY = "action-cookie-consent";

/** Evento que dispara cualquier escritura de consentimiento (aceptar, rechazar o resetear). */
export const CONSENT_EVENT = "action:consent-change";

export type ConsentValue = "granted" | "denied";

export function readStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Modo privado / storage bloqueado: tratamos como "sin decidir".
    return null;
  }
}

export function storeConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Si no persiste, el banner volverá a aparecer en la próxima visita — no es un error fatal.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Borra la decisión guardada, para que el banner vuelva a aparecer ("preferencias de cookies"). */
export function resetConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // no-op
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
