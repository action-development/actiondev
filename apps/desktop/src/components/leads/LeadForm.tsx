"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import {
  LEAD_BUDGETS,
  LEAD_BUDGET_LABELS,
  LEAD_CONTACT_PREFERENCES,
  LEAD_CONTACT_PREFERENCE_LABELS,
  LEAD_NEEDS_CAMPAIGN,
  LEAD_NEED_LABELS,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  type LeadBudget,
  type LeadNeed,
  type LeadSource,
} from "@actiondev/shared";
import { HoloButton } from "@/components/ui/HoloButton";
import { whatsappHref, whatsappTextForNeed } from "@/lib/leads/whatsapp";
import { LEAD_LIMITS } from "@/lib/leads/validation";
import { FIRST_MEETING_OFFER, RECEIVED_MESSAGE, SUBMIT_ERROR_MESSAGE } from "./copy";
import { useLeadForm } from "./useLeadForm";

/**
 * Formulario cualificador de dos pasos. Reutilizable: las landings de campaña
 * (`/hablemos/*`, `source="ads_landing"`) y las landings SEO
 * (`source="seo_landing"`) montan el mismo componente.
 *
 * Los textos van en ESPAÑOL FIJO, sin `useT()`: el selector de idioma cambia
 * a EN tras hidratar y un formulario de campaña en castellano no puede
 * traducirse a mitad de página. Envía a `POST /api/lead` (el cliente no carga
 * el SDK de Firebase) y, con el lead ya guardado, mide con `trackLead` y
 * navega a `/hablemos/gracias`.
 *
 * La lógica (pasos, validación, atribución, envío) vive en `useLeadForm`; este
 * archivo es solo la piel holográfica de escritorio.
 */

interface LeadFormProps {
  /** Necesidad preseleccionada en el paso 1. */
  defaultNeed: LeadNeed;
  /**
   * Opciones del paso 1, en orden. Cuatro: la rejilla es 2×2. `LEAD_NEEDS_CAMPAIGN`
   * por defecto (`/hablemos/*`); las landings SEO de web pasan `LEAD_NEEDS_WEB`.
   * `defaultNeed` tiene que estar dentro.
   */
  needs?: readonly LeadNeed[];
  source: LeadSource;
  /** Identifica la landing (`app`, `software`…): va al aviso interno, no al documento. */
  offer: string;
  /**
   * Línea de oferta bajo «Siguiente» (`lead-offer`). Por defecto
   * `FIRST_MEETING_OFFER` (landings SEO); `/hablemos/*` pasa `ADS_OFFER_LINE`.
   */
  offerLine?: string;
  /** Prefijo de los `data-testid`. Por defecto `lead`. */
  testIdPrefix?: string;
}

const inputClass =
  "block h-[52px] w-full border-2 border-border bg-background px-3.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-foreground";

const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

function StepBars({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <p className="micro-label">Paso {step} de 2</p>
      <div className="flex flex-1 gap-1" aria-hidden>
        <span className="h-[3px] flex-1 bg-accent" />
        <span className={`h-[3px] flex-1 ${step === 2 ? "bg-accent" : "bg-border"}`} />
      </div>
    </div>
  );
}

function FieldError({ id, testId, message }: { id: string; testId: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} data-testid={testId} role="alert" className="mt-1.5 text-sm text-foreground">
      <span aria-hidden className="mr-1.5 text-accent">
        !
      </span>
      {message}
    </p>
  );
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[13px] leading-snug text-muted">
      {children}
    </p>
  );
}

export function LeadForm({
  defaultNeed,
  needs = LEAD_NEEDS_CAMPAIGN,
  source,
  offer,
  offerLine = FIRST_MEETING_OFFER,
  testIdPrefix = "lead",
}: LeadFormProps) {
  const uid = useId();
  const tid = (name: string) => `${testIdPrefix}-${name}`;
  const fid = (name: string) => `${uid}-${name}`;

  const {
    refs: { form: formRef, name: nameRef, phone: phoneRef, email: emailRef, budget: budgetRef },
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
    sending,
    goNext,
    onSubmit,
  } = useLeadForm({ defaultNeed, source, offer });

  return (
    <form
      ref={formRef}
      data-testid={tid("form")}
      data-offer={offer}
      noValidate
      onSubmit={onSubmit}
      className="holo-surface holo-solid holo-corners relative p-4 sm:p-5"
    >
      {step === 1 ? (
        <div key="step-1" data-testid={tid("step-1")} className="lead-step">
          <StepBars step={1} />

          <fieldset className="mt-3">
            <legend className="mb-2 text-[15px] font-semibold text-foreground">¿Qué necesitas?</legend>
            <div className="grid grid-cols-2 gap-2">
              {needs.map((value) => (
                <label key={value} className="lead-choice h-12 px-3 sm:h-14">
                  <input
                    type="radio"
                    name="need"
                    value={value}
                    checked={need === value}
                    onChange={() => setNeed(value)}
                    data-testid={tid(`field-need-${value}`)}
                  />
                  <span className="text-sm font-semibold leading-tight text-foreground">
                    {LEAD_NEED_LABELS[value]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-3" aria-describedby={errors.stage ? fid("err-stage") : undefined}>
            <legend className="mb-2 text-[15px] font-semibold text-foreground">¿En qué punto estás?</legend>
            <div className="grid gap-2">
              {LEAD_STAGES.map((value) => (
                <label key={value} className="lead-choice min-h-11 px-3 py-1.5">
                  <input
                    type="radio"
                    name="stage"
                    value={value}
                    checked={stage === value}
                    onChange={() => {
                      setStage(value);
                      clearError("stage");
                    }}
                    data-testid={tid(`field-stage-${value}`)}
                  />
                  <span className="text-sm font-semibold leading-tight text-foreground">
                    {LEAD_STAGE_LABELS[value]}
                  </span>
                </label>
              ))}
            </div>
            <FieldError id={fid("err-stage")} testId={tid("error-stage")} message={errors.stage} />
          </fieldset>

          <button
            type="button"
            onClick={goNext}
            data-testid={tid("next")}
            className="holo-btn holo-btn-solid mt-3 min-h-[52px] w-full text-[13px]"
          >
            <span className="inline-flex items-center gap-2">Siguiente</span>
          </button>
          {/* La oferta de los anuncios junto a la decisión (hay hueco libre bajo «Siguiente»). */}
          <p data-testid={tid("offer")} className="mt-2.5 text-center text-[13px] text-muted">
            {offerLine}
          </p>
        </div>
      ) : (
        <div key="step-2" data-testid={tid("step-2")} className="lead-step">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <StepBars step={2} />
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              data-testid={tid("back")}
              className="holo-btn holo-btn-quiet holo-btn-sm"
            >
              <span className="inline-flex items-center gap-2">Atrás</span>
            </button>
          </div>

          <div className="mt-3.5 grid gap-x-3 gap-y-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor={fid("name")} className={labelClass}>
                Nombre
              </label>
              <input
                ref={nameRef}
                id={fid("name")}
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={LEAD_LIMITS.name}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? fid("err-name") : undefined}
                data-testid={tid("field-name")}
                className={inputClass}
              />
              <FieldError id={fid("err-name")} testId={tid("error-name")} message={errors.name} />
            </div>

            <div>
              <label htmlFor={fid("phone")} className={labelClass}>
                Teléfono
              </label>
              <input
                ref={phoneRef}
                id={fid("phone")}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                maxLength={LEAD_LIMITS.phoneMax}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError("phone");
                }}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? fid("err-phone") : fid("hint-phone")}
                data-testid={tid("field-phone")}
                className={inputClass}
              />
              {errors.phone ? (
                <FieldError id={fid("err-phone")} testId={tid("error-phone")} message={errors.phone} />
              ) : (
                <Hint id={fid("hint-phone")}>Te llamamos o te escribimos por WhatsApp</Hint>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={fid("email")} className={labelClass}>
                Email
              </label>
              <input
                ref={emailRef}
                id={fid("email")}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={LEAD_LIMITS.email}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? fid("err-email") : undefined}
                data-testid={tid("field-email")}
                className={inputClass}
              />
              <FieldError id={fid("err-email")} testId={tid("error-email")} message={errors.email} />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor={fid("budget")} className={labelClass}>
              Presupuesto orientativo
            </label>
            <div className="relative">
              <select
                ref={budgetRef}
                id={fid("budget")}
                name="budget"
                required
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value as LeadBudget);
                  clearError("budget");
                }}
                aria-invalid={!!errors.budget}
                aria-describedby={errors.budget ? fid("err-budget") : fid("hint-budget")}
                data-testid={tid("field-budget")}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="" disabled>
                  Elige una opción
                </option>
                {LEAD_BUDGETS.map((value) => (
                  <option key={value} value={value}>
                    {LEAD_BUDGET_LABELS[value]}
                  </option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-accent">
                ▾
              </span>
            </div>
            {errors.budget ? (
              <FieldError id={fid("err-budget")} testId={tid("error-budget")} message={errors.budget} />
            ) : (
              <Hint id={fid("hint-budget")}>Solo para orientar la propuesta; no te compromete a nada.</Hint>
            )}
          </div>

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold text-foreground">¿Cómo prefieres que te contactemos?</legend>
            <div className="grid grid-cols-3 gap-2">
              {LEAD_CONTACT_PREFERENCES.map((value) => (
                <label key={value} className="lead-choice h-12 justify-center px-2">
                  <input
                    type="radio"
                    name="contactPreference"
                    value={value}
                    checked={contactPreference === value}
                    onChange={() => setContactPreference(value)}
                    data-testid={tid(`field-contact-${value}`)}
                  />
                  <span className="text-sm font-semibold text-foreground">{LEAD_CONTACT_PREFERENCE_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Empresa y detalles: opcionales, plegados para acortar el paso en móvil. El canal preferido va FUERA: la API lo exige y su valor por defecto tiene que verse. */}
          <details data-testid={tid("extras")} className="disclosure group mt-4 border-t-2 border-border pt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              Añadir empresa y detalles (opcional)
              <span aria-hidden className="shrink-0 text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="grid gap-3.5 pt-2">
              <div>
                <label htmlFor={fid("company")} className={labelClass}>
                  Empresa
                </label>
                <input
                  id={fid("company")}
                  name="company"
                  type="text"
                  autoComplete="organization"
                  maxLength={LEAD_LIMITS.company}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  data-testid={tid("field-company")}
                  className={inputClass}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <label htmlFor={fid("notes")} className="text-sm font-semibold text-foreground">
                    Cuéntanoslo en dos líneas
                  </label>
                  <span className="text-xs text-muted" aria-hidden>
                    {notes.length}/{LEAD_LIMITS.notes}
                  </span>
                </div>
                <textarea
                  id={fid("notes")}
                  name="notes"
                  rows={2}
                  maxLength={LEAD_LIMITS.notes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej.: que los técnicos rellenen los partes en la nave y lleguen al instante a la oficina"
                  data-testid={tid("field-notes")}
                  className="block min-h-[92px] w-full lg:min-h-[64px] resize-none border-2 border-border bg-background px-3.5 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </details>

          {/* Honeypot: fuera de pantalla, fuera del árbol accesible y fuera del tabulador. */}
          <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
            <label>
              Web
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                data-testid={tid("field-website")}
              />
            </label>
          </div>

          {/* Primera capa RGPD (art. 13): sin casillas, el tratamiento es precontractual. */}
          <p data-testid={tid("privacy")} className="mt-5 text-xs leading-relaxed text-foreground/70">
            <strong className="font-semibold text-foreground">Responsable:</strong> Alcasi Systems, S.L.{" "}
            <strong className="font-semibold text-foreground">Finalidad:</strong> responder a tu solicitud y preparar un
            presupuesto. <strong className="font-semibold text-foreground">Legitimación:</strong> medidas precontractuales
            a petición tuya. <strong className="font-semibold text-foreground">Destinatarios:</strong> proveedores de
            alojamiento, correo y CRM (Google Firebase, Vercel, Supabase, one.com y, si está activado, Telegram) como encargados del
            tratamiento y, solo si aceptas las cookies, Google y Meta para medir campañas; no se ceden a terceros salvo
            obligación legal. Los datos se alojan en Google Firebase (EE. UU.) con garantías adecuadas.{" "}
            <strong className="font-semibold text-foreground">Derechos:</strong> acceso, rectificación, supresión y otros en
            hi@actiondev.es. Más información en la{" "}
            <Link
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="link-sweep text-accent hover:text-foreground"
            >
              Política de privacidad
            </Link>
            .
          </p>

          {status === "error" && (
            <div data-testid={tid("error")} role="alert" className="lead-step mt-4 border-2 border-foreground p-3.5">
              <p className="text-sm text-foreground">{SUBMIT_ERROR_MESSAGE}</p>
              <div className="mt-3">
                <HoloButton href={whatsappHref(whatsappTextForNeed(need))} size="sm" data-testid={tid("whatsapp")}>
                  Escribir por WhatsApp
                </HoloButton>
              </div>
            </div>
          )}

          {status === "received" ? (
            <p data-testid={tid("received")} role="status" className="lead-step mt-4 border-2 border-foreground p-3.5 text-sm text-foreground">
              {RECEIVED_MESSAGE}
            </p>
          ) : (
            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              data-testid={tid("submit")}
              className="holo-btn holo-btn-solid mt-4 min-h-[52px] w-full text-[13px] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">{sending ? "Enviando…" : "Enviar mi proyecto"}</span>
            </button>
          )}
          <p className="mt-2.5 text-center text-[13px] text-muted">Primera reunión gratis y sin compromiso. Te respondemos en 24 horas laborables.</p>
        </div>
      )}
    </form>
  );
}
