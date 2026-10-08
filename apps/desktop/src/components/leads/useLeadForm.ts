"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  readStoredConsent,
  track,
  trackLead,
  type LeadAttribution,
  type LeadBudget,
  type LeadContactPreference,
  type LeadNeed,
  type LeadSource,
  type LeadStage,
} from "@actiondev/shared";
import { LEAD_LIMITS, isValidEmail, isValidPhone, phoneDigits, PHONE_MIN_DIGITS } from "@/lib/leads/validation";
import { useWhatsappClickTracking } from "./useWhatsappClickTracking";

/**
 * Lógica del formulario cualificador de dos pasos, sin marcado: estado de los
 * pasos, validación, atribución de la URL, honeypot, `elapsedMs`, envío a
 * `POST /api/lead`, `trackLead` (solo con el lead ya guardado) y redirección.
 * La consumen `LeadForm` (escritorio, holográfico) y `MobileLeadForm` (web
 * móvil): cambia la piel, no la lógica.
 *
 * Atribución (utm_*, gclid…): se lee de la URL al montar y vive SOLO en el
 * estado — ni `localStorage` ni cookies.
 *
 * Embudo (sin datos personales, por `track()`: solo con consentimiento):
 * `lead_form_step` al llegar al paso 2 (una vez por formulario),
 * `lead_submit_error` con el tipo de fallo y `whatsapp_click` con
 * `link_location` en los enlaces de WhatsApp del formulario
 * (`useWhatsappClickTracking`). `generate_lead` no cambia.
 */

export type LeadFieldName = "stage" | "name" | "phone" | "email" | "budget";
export type LeadFormErrors = Partial<Record<LeadFieldName, string>>;
/**
 * `received` = la API aceptó el envío SIN `id`: lo ha descartado como bot
 * (honeypot o envío demasiado rápido) con un 200 falso. Se confirma en el
 * propio formulario, en silencio: ni `generate_lead` ni redirección a
 * `/hablemos/gracias` (su visita no puede parecer un lead real).
 */
export type LeadFormStatus = "idle" | "sending" | "sent" | "received" | "error";

/** Sin respuesta en este tiempo (cobertura mala), el envío se da por fallido y se ofrece reintentar. */
export const LEAD_SUBMIT_TIMEOUT_MS = 20_000;

/** Tipo de fallo para `lead_submit_error` (nunca el mensaje ni datos del lead). */
export type LeadSubmitErrorType = "timeout" | "network" | "rate_limited" | "rejected" | "server" | "bad_response";

function submitErrorType(httpStatus: number | null, timedOut: boolean): LeadSubmitErrorType {
  if (timedOut) return "timeout";
  if (httpStatus === null) return "network";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus >= 500) return "server";
  if (httpStatus >= 400) return "rejected";
  return "bad_response";
}

/**
 * Identificador del envío (`submissionId`), el MISMO en cada reintento del
 * mismo formulario: es la clave de idempotencia para `POST /api/lead`, que
 * puede usarlo como ID del documento (`createLeadWithId`, como los leads de
 * Meta) para que un reintento tras el tiempo límite no cree un segundo lead
 * si el primero sí llegó. Aleatorio, sin datos del visitante y solo en memoria.
 */
function newSubmissionId(): string {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

interface UseLeadFormOptions {
  defaultNeed: LeadNeed;
  source: LeadSource;
  /** Identifica la landing (`app`, `software`…): va al aviso interno, no al documento. */
  offer: string;
}

const ATTRIBUTION_PARAMS: [keyof LeadAttribution, string][] = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmTerm", "utm_term"],
  ["utmContent", "utm_content"],
  ["gclid", "gclid"],
  ["gbraid", "gbraid"],
  ["wbraid", "wbraid"],
  ["fbclid", "fbclid"],
];

function readAttribution(): LeadAttribution {
  if (typeof window === "undefined") return {};
  const query = new URLSearchParams(window.location.search);
  const attribution: LeadAttribution = {};
  for (const [key, param] of ATTRIBUTION_PARAMS) {
    const value = query.get(param)?.trim().slice(0, LEAD_LIMITS.attribution);
    if (value) attribution[key] = value;
  }
  attribution.landingPath = window.location.pathname.slice(0, LEAD_LIMITS.attribution);
  return attribution;
}

export function useLeadForm({ defaultNeed, source, offer }: UseLeadFormOptions) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  /** Presupuesto como `<select>` (escritorio). */
  const budgetRef = useRef<HTMLSelectElement>(null);
  /** Presupuesto como tiles (móvil): el primer radio recibe el foco del error. */
  const budgetFocusRef = useRef<HTMLElement | null>(null);
  const mountedAt = useRef(0);
  const previousStep = useRef<1 | 2>(1);
  const submissionId = useRef<string | null>(null);
  const step2Tracked = useRef(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [need, setNeed] = useState<LeadNeed>(defaultNeed);
  const [stage, setStage] = useState<LeadStage | "">("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState<LeadBudget | "">("");
  const [notes, setNotes] = useState("");
  const [contactPreference, setContactPreference] = useState<LeadContactPreference>("whatsapp");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [status, setStatus] = useState<LeadFormStatus>("idle");
  // Solo en el estado (no se pinta): se lee al montar, en el navegador.
  const [attribution] = useState<LeadAttribution>(readAttribution);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  // `whatsapp_click` en los enlaces de WhatsApp del propio formulario (paso 1 y error).
  useWhatsappClickTracking(formRef);

  // El foco acompaña al cambio de paso: al primer campo del 2, y al volver, a
  // la necesidad elegida. No en el montaje (no robar el foco a la página).
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (step === 2) nameRef.current?.focus();
    else formRef.current?.querySelector<HTMLInputElement>('input[name="need"]:checked')?.focus();
  }, [step]);

  const clearError = (field: LeadFieldName) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const goNext = () => {
    if (!stage) {
      setErrors({ stage: "Elige en qué punto estás" });
      return;
    }
    setErrors({});
    setStep(2);
    // Embudo: cuántos pasan del paso 1 al 2. Una vez por formulario (ir y volver no suma).
    if (!step2Tracked.current) {
      step2Tracked.current = true;
      track("lead_form_step", {
        form_step: "2",
        lead_source: source,
        lead_need: need,
        lead_stage: stage,
        page_path: window.location.pathname,
      });
    }
  };

  const validateStep2 = (): LeadFormErrors => {
    const found: LeadFormErrors = {};
    if (!name.trim()) found.name = "Dinos cómo te llamamos";
    const phoneValue = phone.trim();
    if (!phoneValue) found.phone = "Falta tu teléfono para poder llamarte";
    else if (!isValidPhone(phoneValue)) {
      found.phone =
        phoneDigits(phoneValue) < PHONE_MIN_DIGITS
          ? `Revisa el teléfono: necesitamos al menos ${PHONE_MIN_DIGITS} dígitos`
          : "Revisa el teléfono: solo números, espacios y el + del prefijo";
    }
    const emailValue = email.trim();
    if (!emailValue) found.email = "Falta tu email para enviarte la propuesta";
    else if (!isValidEmail(emailValue)) found.email = "Revisa el email: parece que le falta algo";
    if (!budget) found.budget = "Elige una opción; «Aún no lo sé» también vale";
    return found;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      goNext();
      return;
    }
    if (status === "sending" || status === "sent" || status === "received") return;

    const found = validateStep2();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first: [LeadFieldName, { current: HTMLElement | null }][] = [
        ["name", nameRef],
        ["phone", phoneRef],
        ["email", emailRef],
        ["budget", budgetRef.current ? budgetRef : budgetFocusRef],
      ];
      first.find(([field]) => found[field])?.[1].current?.focus();
      return;
    }

    setStatus("sending");
    // Mismo id en todos los reintentos de este formulario (clave de idempotencia).
    submissionId.current ??= newSubmissionId();
    // Tiempo límite con `AbortController` + `setTimeout` (no `AbortSignal.timeout`,
    // que iOS 15 no tiene): cubre la petición y la lectura de la respuesta.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LEAD_SUBMIT_TIMEOUT_MS);
    let httpStatus: number | null = null;
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          source,
          offer,
          need,
          stage,
          name: name.trim(),
          company: company.trim() || undefined,
          phone: phone.trim(),
          email: email.trim(),
          budget,
          notes: notes.trim() || undefined,
          contactPreference,
          attribution,
          consent: readStoredConsent() ?? "unknown",
          website: honeypot,
          elapsedMs: Math.round(performance.now() - mountedAt.current),
          submissionId: submissionId.current,
        }),
      });
      httpStatus = response.status;
      const data = (await response.json().catch(() => null)) as { ok?: boolean; id?: string } | null;
      if (controller.signal.aborted) throw new Error("lead timeout");
      if (!response.ok || data?.ok !== true) throw new Error(`lead ${response.status}`);

      // Sin `id`, la API lo ha descartado como bot y responde un 200 falso: se
      // confirma igual (que no sepa que se le descartó), pero NO es una
      // conversión ni una visita a /gracias.
      if (!data.id) {
        setStatus("received");
        return;
      }

      trackLead(
        {
          lead_id: data.id,
          transaction_id: data.id,
          lead_source: source,
          lead_need: need,
          lead_budget: budget,
          page_path: window.location.pathname,
        },
        { email: email.trim(), phone_number: phone.trim() },
      );
      setStatus("sent");
      router.push(`/hablemos/gracias?tipo=${need}`);
    } catch (error) {
      console.error("[lead] no se pudo enviar:", error);
      track("lead_submit_error", {
        error_type: submitErrorType(httpStatus, controller.signal.aborted),
        lead_source: source,
        lead_need: need,
        page_path: window.location.pathname,
      });
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    refs: { form: formRef, name: nameRef, phone: phoneRef, email: emailRef, budget: budgetRef, budgetFocus: budgetFocusRef },
    step,
    setStep,
    need,
    setNeed,
    stage,
    setStage,
    name,
    setName,
    company,
    setCompany,
    phone,
    setPhone,
    email,
    setEmail,
    budget,
    setBudget,
    notes,
    setNotes,
    contactPreference,
    setContactPreference,
    honeypot,
    setHoneypot,
    errors,
    clearError,
    status,
    sending: status === "sending" || status === "sent" || status === "received",
    goNext,
    onSubmit,
  };
}
