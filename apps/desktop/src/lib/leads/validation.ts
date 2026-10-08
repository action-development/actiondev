/**
 * Reglas de validación de un lead — UNA sola fuente para el formulario
 * (mensajes al visitante) y para `POST /api/lead` (rechazo estricto). Puras:
 * sin `window` ni dependencias de servidor, así que valen en los dos lados.
 */

export const LEAD_LIMITS = {
  name: 120,
  company: 160,
  email: 160,
  phoneMin: 6,
  phoneMax: 30,
  notes: 500,
  attribution: 300,
} as const;

/** Dígitos mínimos de un teléfono (ignora espacios, guiones, paréntesis y `+`). */
export const PHONE_MIN_DIGITS = 9;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_CHARS_RE = /^[0-9+()\-\s.]+$/;

export function phoneDigits(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

export function isValidEmail(email: string): boolean {
  return email.length <= LEAD_LIMITS.email && EMAIL_RE.test(email);
}

export function isValidPhone(phone: string): boolean {
  return (
    phone.length >= LEAD_LIMITS.phoneMin &&
    phone.length <= LEAD_LIMITS.phoneMax &&
    PHONE_CHARS_RE.test(phone) &&
    phoneDigits(phone) >= PHONE_MIN_DIGITS
  );
}
