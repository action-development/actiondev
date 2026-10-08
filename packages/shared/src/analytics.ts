/**
 * Google Tag Manager + consentimiento de cookies.
 *
 * Fuente única para desktop y mobile: mismo contenedor GTM y misma clave de
 * almacenamiento, para que aceptar/rechazar en una zona no deje a la otra en
 * un estado inconsistente si algún día comparten dominio de verdad.
 */

export const GTM_ID = "GTM-T9766P5S";

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

/* ------------------------------------------------------------------------ */
/* Consent Mode v2 (modo básico) + eventos de conversión                    */
/* ------------------------------------------------------------------------ */

type DataLayerWindow = Window & { dataLayer?: unknown[] };

function dataLayer(): unknown[] {
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}

/**
 * `gtag()` de Google: los comandos de consentimiento TIENEN que entrar en el
 * `dataLayer` como objeto `arguments`, no como array — GTM ignora un array.
 */
function gtag(..._args: unknown[]): void {
  // eslint-disable-next-line prefer-rest-params
  dataLayer().push(arguments);
}

let consentDefaultSent = false;
let lastConsentUpdate: ConsentValue | null = null;

/**
 * Consent Mode v2 en modo BÁSICO: GTM sigue sin cargar hasta que hay un
 * "granted" (`GoogleTagManager.tsx`), pero cuando carga ya encuentra en el
 * `dataLayer` el `default` denegado + el `update` concedido, que es lo que
 * Google Ads exige en el EEE para medir conversiones (ad_user_data /
 * ad_personalization). Si el visitante revoca desde el Footer con GTM ya
 * cargado, el `update` a denegado corta los tags en esa misma página.
 *
 * Llamarlo ANTES de inyectar el script de GTM, y en cada cambio de decisión.
 */
export function applyConsent(value: ConsentValue | null): void {
  if (typeof window === "undefined") return;
  if (!consentDefaultSent) {
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    consentDefaultSent = true;
  }
  const next: ConsentValue = value === "granted" ? "granted" : "denied";
  // Sin decisión previa concedida, "denied" ya es el default: no hace falta repetirlo.
  if (next === lastConsentUpdate || (next === "denied" && lastConsentUpdate === null)) return;
  gtag("consent", "update", {
    ad_storage: next,
    ad_user_data: next,
    ad_personalization: next,
    analytics_storage: next,
  });
  lastConsentUpdate = next;
}

/**
 * Única puerta de salida al `dataLayer` para eventos de medición. El
 * `dataLayer` existe ya sin GTM (lo crea el `default` de consentimiento), así
 * que "hay dataLayer" ya no significa "hay consentimiento": se mira la decisión
 * guardada y, sin un "granted", no se empuja nada.
 */
function pushIfGranted(payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || readStoredConsent() !== "granted") return;
  dataLayer().push(payload);
}

/** Empuja un evento al `dataLayer` SOLO con consentimiento concedido. */
export function track(event: string, params: Record<string, string> = {}): void {
  pushIfGranted({ event, ...params });
}

/**
 * Teléfono en E.164 (`+34600123456`) o `undefined` si no hay forma fiable de
 * saberlo. Nueve dígitos españoles (empiezan por 6-9) → `+34…`; con `+` o
 * `00` delante se respeta el prefijo que ya trae. Lo usan las conversiones
 * mejoradas de Google Ads (`user_data.phone_number`) y el aviso por email
 * (enlace `wa.me`). No valida que el número exista.
 */
export function toE164(phone: string): string | undefined {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;
  const international = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (international) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : undefined;
  if (digits.length === 9 && /^[6-9]/.test(digits)) return `+34${digits}`;
  if (digits.length === 11 && digits.startsWith("34") && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return undefined;
}

/**
 * Conversión de lead: `generate_lead` con los parámetros de la campaña y, para
 * las conversiones mejoradas, el email y el teléfono (E.164) del lead. SOLO con
 * consentimiento `granted` (misma puerta que `track`).
 *
 * El contrato de `params` lo consume GTM por nombre: `lead_id`,
 * `transaction_id` (= `lead_id`, desduplica), `lead_source`, `lead_need`,
 * `lead_budget` y `page_path`. Si se cambia uno, cambiar GTM a la vez.
 */
export function trackLead(
  params: Record<string, string>,
  userData?: { email?: string; phone_number?: string },
): void {
  const email = userData?.email?.trim().toLowerCase();
  const phone = userData?.phone_number ? toE164(userData.phone_number) : undefined;
  const user_data = {
    ...(email && { email }),
    ...(phone && { phone_number: phone }),
  };
  pushIfGranted({
    event: "generate_lead",
    ...params,
    ...(Object.keys(user_data).length > 0 && { user_data }),
  });
}

/** Canal de contacto de un `href`, o `null` si no es una conversión. */
export function contactChannel(href: string): "whatsapp" | "email" | "phone" | null {
  if (href.startsWith("https://wa.me/")) return "whatsapp";
  if (href.startsWith("mailto:")) return "email";
  if (href.startsWith("tel:")) return "phone";
  return null;
}

/** Evento de conversión por canal: `click_whatsapp` / `click_email` / `click_phone`. */
export function trackContact(href: string): void {
  const channel = contactChannel(href);
  if (!channel) return;
  track(`click_${channel}`, {
    contact_channel: channel,
    link_url: href.split("?")[0],
    page_path: window.location.pathname,
  });
}

/**
 * Un solo listener en fase de captura para TODOS los enlaces de contacto del
 * documento (landings, HUD de /contact, Footer, legales, home mobile…),
 * presentes y futuros. Lo que abre un canal sin `<a>` (la calle 3D de
 * /contact) llama a `trackContact` a mano. Devuelve la limpieza.
 */
export function listenContactClicks(): () => void {
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest?.("a[href]");
    if (anchor) trackContact(anchor.getAttribute("href") ?? "");
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
