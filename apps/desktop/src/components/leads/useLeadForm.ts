"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  readStoredConsent,
  trackLead,
  type LeadAttribution,
  type LeadBudget,
  type LeadContactPreference,
  type LeadNeed,
  type LeadSource,
  type LeadStage,
} from "@actiondev/shared";
import { LEAD_LIMITS, isValidEmail, isValidPhone, phoneDigits, PHONE_MIN_DIGITS } from "@/lib/leads/validation";

/**
 * Lógica del formulario cualificador de dos pasos, sin marcado: estado de los
 * pasos, validación, atribución de la URL, honeypot, `elapsedMs`, envío a
 * `POST /api/lead`, `trackLead` (solo con el lead ya guardado) y redirección.
 * La consumen `LeadForm` (escritorio, holográfico) y `MobileLeadForm` (web
 * móvil): cambia la piel, no la lógica.
 *
 * Atribución (utm_*, gclid…): se lee de la URL al montar y vive SOLO en el
 * estado — ni `localStorage` ni cookies.
 */

export type LeadFieldName = "stage" | "name" | "phone" | "email" | "budget";
export type LeadFormErrors = Partial<Record<LeadFieldName, string>>;
export type LeadFormStatus = "idle" | "sending" | "sent" | "error";

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
    if (status === "sending" || status === "sent") return;

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
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; id?: string } | null;
      if (!response.ok || data?.ok !== true) throw new Error(`lead ${response.status}`);

      const leadId = data.id ?? `lead-${Date.now()}`;
      trackLead(
        {
          lead_id: leadId,
          transaction_id: leadId,
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
      setStatus("error");
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
    sending: status === "sending" || status === "sent",
    goNext,
    onSubmit,
  };
}
