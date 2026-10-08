"use client";

import { useId, type ReactNode } from "react";
import {
  LEAD_BUDGETS,
  LEAD_BUDGET_LABELS,
  LEAD_CONTACT_PREFERENCES,
  LEAD_CONTACT_PREFERENCE_LABELS,
  LEAD_NEEDS_CAMPAIGN,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  type LeadNeed,
  type LeadSource,
} from "@actiondev/shared";
import { useLeadForm } from "@/components/leads/useLeadForm";
import { whatsappHref, whatsappTextForNeed } from "@/lib/leads/whatsapp";
import { LEAD_LIMITS } from "@/lib/leads/validation";

/**
 * Formulario cualificador de la web móvil: misma lógica que `LeadForm`
 * (`useLeadForm`), otra piel (DESIGN.md §7, «Formulario por pasos»). Textos en
 * ESPAÑOL FIJO, sin `useT()`. Tiles en vez de selects, sin radios visibles, sin
 * sombras ni redondeos.
 */

/** Nombres llanos de la maqueta móvil. Los VALORES (`LEAD_NEEDS`) no cambian. */
export const MOBILE_NEED_LABELS: Record<LeadNeed, string> = {
  app: "Una app",
  software: "Un programa de gestión",
  integration: "Conectar programas",
  web: "Una web",
  unsure: "Aún no lo sé",
};

interface MobileLeadFormProps {
  /** Necesidad preseleccionada en el paso 1. Tiene que estar en `needs`. */
  defaultNeed: LeadNeed;
  /** Opciones del paso 1, en orden (rejilla 2×2). `LEAD_NEEDS_CAMPAIGN` por defecto. */
  needs?: readonly LeadNeed[];
  source: LeadSource;
  /** Identifica la landing (`app`, `software`…): va al aviso interno, no al documento. */
  offer: string;
  /** Prefijo de los `data-testid`. Por defecto `m-lead`. */
  testIdPrefix?: string;
  /** Id del `<form>`, para anclas (`#proyecto`). */
  id?: string;
  /**
   * Variante compacta del paso 1 (DESIGN.md §7, landings de campaña): cabecera
   * de paso en una fila, tiles de necesidad horizontales, filas de «¿En qué
   * punto estás?» más bajas y «Siguiente» de 56 px, para que el paso 1 entero
   * quepa en la primera pantalla a 390×844 aun con el banner de cookies
   * abierto. El paso 2 no cambia: allí el visitante ya se ha decidido.
   */
  compact?: boolean;
}

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink";

const fieldClass = `block h-14 w-full rounded-none border-2 border-ink bg-paper px-3.5 font-display text-[22px] font-extrabold text-ink placeholder:font-semibold placeholder:text-muted-dark aria-[invalid=true]:border-[3px] ${focusRing}`;

const labelClass = "font-display text-[15px] font-bold uppercase tracking-[0.06em] text-ink";

const tileClass =
  "group relative flex cursor-pointer bg-paper text-ink not-has-[:checked]:hover:bg-grey has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:z-10 has-[:focus-visible]:outline-3 has-[:focus-visible]:-outline-offset-6 has-[:focus-visible]:outline-ink has-[:checked:focus-visible]:outline-lime";

const tileInputClass = "absolute inset-0 m-0 size-full cursor-pointer opacity-0";

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-[18px] fill-none stroke-current stroke-[3.5]">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

function Box() {
  return (
    <span
      aria-hidden
      className="grid size-[26px] flex-none place-items-center border-[3px] border-current group-has-[:checked]:border-lime group-has-[:checked]:bg-lime group-has-[:checked]:text-ink [&>svg]:hidden group-has-[:checked]:[&>svg]:block"
    >
      <Check />
    </span>
  );
}

function StepHeader({
  step,
  onBack,
  backTestId,
  compact = false,
}: {
  step: 1 | 2;
  onBack?: () => void;
  backTestId: string;
  /** «Paso 1 de 2» y las dos barras en UNA fila. */
  compact?: boolean;
}) {
  return (
    <div className="flex items-stretch border-b border-ink">
      <div className={compact ? "flex flex-1 items-center gap-3 px-5 py-2.5" : "grid flex-1 gap-2 px-5 pb-3 pt-3.5"}>
        <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink">Paso {step} de 2</p>
        <div className={`grid grid-cols-2 gap-1.5${compact ? " flex-1" : ""}`} aria-hidden>
          <span className="h-2 border-2 border-ink bg-ink" />
          <span className={`h-2 border-2 border-ink ${step === 2 ? "bg-ink" : ""}`} />
        </div>
      </div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          data-testid={backTestId}
          className={`flex min-h-12 items-center gap-1.5 border-l border-ink px-4 font-display text-[15px] font-extrabold uppercase tracking-[0.08em] text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper ${focusRing}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-5 fill-none stroke-current stroke-[2.5]">
            <path d="M20 12H4m6-7l-7 7 7 7" />
          </svg>
          Atrás
        </button>
      )}
    </div>
  );
}

function FieldError({ id, testId, message }: { id: string; testId: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} data-testid={testId} role="alert" className="flex items-start gap-2.5 bg-ink px-3 py-2.5 text-[15px] leading-snug text-paper">
      <span aria-hidden className="grid size-[22px] flex-none place-items-center bg-lime font-display font-black text-ink">
        !
      </span>
      {message}
    </p>
  );
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm text-muted">
      {children}
    </p>
  );
}

const legendBase = "w-full px-5 font-display text-2xl font-black uppercase leading-[0.95] tracking-[-0.01em] text-ink";
const legendClass = `${legendBase} pb-3 pt-[18px]`;

export function MobileLeadForm({
  defaultNeed,
  needs = LEAD_NEEDS_CAMPAIGN,
  source,
  offer,
  testIdPrefix = "m-lead",
  id,
  compact = false,
}: MobileLeadFormProps) {
  const uid = useId();
  const tid = (name: string) => `${testIdPrefix}-${name}`;
  const fid = (name: string) => `${uid}-${name}`;

  const {
    refs: { form: formRef, name: nameRef, phone: phoneRef, email: emailRef, budgetFocus: budgetFocusRef },
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

  const buttonBase = `flex min-h-16 w-full items-center justify-center gap-2.5 px-5 font-display text-xl font-black uppercase tracking-[0.04em] ${focusRing}`;

  // Paso 1: medidas de la variante compacta (solo medidas; colores, estados y lógica iguales).
  const step1Legend = compact ? `${legendBase} pb-2 pt-2.5` : legendClass;
  const needTile = compact
    ? "min-h-14 flex-row-reverse items-center justify-between gap-2.5 py-2 pl-4 pr-3"
    : "min-h-[92px] flex-col justify-between gap-3 py-3.5 pl-5 pr-3.5";
  const needText = compact ? "text-[17px]" : "text-xl";
  const stageTile = compact ? "min-h-[46px] py-1.5" : "min-h-16 py-3";
  const nextButton = compact ? buttonBase.replace("min-h-16", "min-h-14") : buttonBase;

  return (
    <form
      ref={formRef}
      id={id}
      data-testid={tid("form")}
      data-offer={offer}
      noValidate
      onSubmit={onSubmit}
      className="relative bg-paper font-body text-ink"
    >
      {step === 1 ? (
        <div key="step-1" data-testid={tid("step-1")}>
          <StepHeader step={1} backTestId={tid("back")} compact={compact} />

          <fieldset>
            <legend className={step1Legend}>¿Qué necesitas?</legend>
            <div className="grid grid-cols-2 gap-px border-y border-ink bg-ink">
              {needs.map((value) => (
                <label key={value} className={`${tileClass} ${needTile}`}>
                  <input
                    type="radio"
                    name="need"
                    value={value}
                    checked={need === value}
                    onChange={() => setNeed(value)}
                    data-testid={tid(`field-need-${value}`)}
                    className={tileInputClass}
                  />
                  <span className="flex justify-end">
                    <Box />
                  </span>
                  <span className={`font-display font-extrabold uppercase leading-[1.02] ${needText}`}>
                    {MOBILE_NEED_LABELS[value]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset aria-describedby={errors.stage ? fid("err-stage") : undefined}>
            <legend className={step1Legend}>¿En qué punto estás?</legend>
            <div className="grid gap-px border-y border-ink bg-ink">
              {LEAD_STAGES.map((value) => (
                <label key={value} className={`${tileClass} ${stageTile} flex-row items-center gap-3.5 px-5`}>
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
                    className={tileInputClass}
                  />
                  <Box />
                  <span className="text-[17px] font-semibold leading-tight">{LEAD_STAGE_LABELS[value]}</span>
                </label>
              ))}
            </div>
            {errors.stage && (
              <div className="px-5 pt-3">
                <FieldError id={fid("err-stage")} testId={tid("error-stage")} message={errors.stage} />
              </div>
            )}
          </fieldset>

          <div className={`grid gap-3 px-5 pb-6 ${compact ? "pt-3" : "pt-5"}`}>
            <button
              type="button"
              onClick={goNext}
              data-testid={tid("next")}
              className={`${nextButton} bg-ink text-paper hover:bg-lime hover:text-ink active:bg-lime active:text-ink`}
            >
              Siguiente
            </button>
            <a
              href={whatsappHref(whatsappTextForNeed(need))}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={tid("whatsapp-step-1")}
              className={`flex min-h-11 items-center text-[15px] underline underline-offset-2 ${focusRing}`}
            >
              ¿Prefieres escribirnos? Escribir por WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div key="step-2" data-testid={tid("step-2")}>
          <StepHeader step={2} onBack={() => setStep(1)} backTestId={tid("back")} />
          <h2 className={legendClass}>¿Cómo te contactamos?</h2>

          <div className="grid gap-[22px] px-5">
            <div className="grid gap-1.5">
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
                className={fieldClass}
              />
              <FieldError id={fid("err-name")} testId={tid("error-name")} message={errors.name} />
            </div>

            <div className="grid gap-1.5">
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
                className={fieldClass}
              />
              {errors.phone ? (
                <FieldError id={fid("err-phone")} testId={tid("error-phone")} message={errors.phone} />
              ) : (
                <Hint id={fid("hint-phone")}>Te llamamos o te escribimos por WhatsApp</Hint>
              )}
            </div>

            <div className="grid gap-1.5">
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
                autoCapitalize="none"
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
                className={fieldClass}
              />
              <FieldError id={fid("err-email")} testId={tid("error-email")} message={errors.email} />
            </div>
          </div>

          <fieldset className="mt-2" aria-describedby={errors.budget ? fid("err-budget") : fid("hint-budget")}>
            <legend className={legendClass}>Presupuesto orientativo</legend>
            <div className="grid grid-cols-2 gap-px border-y border-ink bg-ink">
              {LEAD_BUDGETS.map((value, index) => (
                <label
                  key={value}
                  className={`${tileClass} min-h-[72px] items-center justify-between gap-2 py-3 pl-5 pr-3.5 ${value === "unknown" ? "col-span-2" : ""}`}
                >
                  <input
                    ref={index === 0 ? (el) => void (budgetFocusRef.current = el) : undefined}
                    type="radio"
                    name="budget"
                    value={value}
                    checked={budget === value}
                    onChange={() => {
                      setBudget(value);
                      clearError("budget");
                    }}
                    data-testid={tid(`field-budget-${value}`)}
                    className={tileInputClass}
                  />
                  <span className="font-display text-[19px] font-extrabold leading-[1.05]">{LEAD_BUDGET_LABELS[value]}</span>
                  <Box />
                </label>
              ))}
            </div>
            <div className="px-5 pt-3">
              {errors.budget ? (
                <FieldError id={fid("err-budget")} testId={tid("error-budget")} message={errors.budget} />
              ) : (
                <Hint id={fid("hint-budget")}>Solo para orientar la propuesta; no te compromete a nada.</Hint>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClass}>¿Cómo prefieres que te contactemos?</legend>
            <div className="grid grid-cols-3 gap-px border-y border-ink bg-ink">
              {LEAD_CONTACT_PREFERENCES.map((value) => (
                <label key={value} className={`${tileClass} min-h-[76px] items-center justify-center gap-2 px-2 py-3 text-center`}>
                  <input
                    type="radio"
                    name="contactPreference"
                    value={value}
                    checked={contactPreference === value}
                    onChange={() => setContactPreference(value)}
                    data-testid={tid(`field-contact-${value}`)}
                    className={tileInputClass}
                  />
                  <span className="font-display text-[17px] font-extrabold uppercase">{LEAD_CONTACT_PREFERENCE_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Empresa y detalles: opcionales y plegados. El canal preferido va FUERA: la API lo exige y su valor por defecto tiene que verse. */}
          <details data-testid={tid("extras")} className="group/extras mt-5 border-y border-ink">
            <summary
              className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-display text-[17px] font-extrabold uppercase tracking-[0.04em] [&::-webkit-details-marker]:hidden ${focusRing}`}
            >
              Añadir empresa y detalles (opcional)
              <span aria-hidden className="text-2xl leading-none group-open/extras:rotate-45">
                +
              </span>
            </summary>
            <div className="grid gap-[22px] px-5 pb-5 pt-2">
              <div className="grid gap-1.5">
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
                  className={fieldClass}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={fid("notes")} className={labelClass}>
                  Cuéntanoslo en dos líneas
                </label>
                <textarea
                  id={fid("notes")}
                  name="notes"
                  rows={3}
                  maxLength={LEAD_LIMITS.notes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej.: que los técnicos rellenen los partes en la nave y lleguen al instante a la oficina"
                  data-testid={tid("field-notes")}
                  className={`block min-h-[104px] w-full resize-none rounded-none border-2 border-ink bg-paper px-3.5 py-3 font-body text-[17px] font-medium leading-[1.4] text-ink placeholder:text-muted-dark ${focusRing}`}
                />
                <span className="text-sm text-muted" aria-hidden>
                  {notes.length}/{LEAD_LIMITS.notes}
                </span>
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

          <div className="grid gap-3 px-5 pb-6 pt-5">
            {/* Primera capa RGPD (art. 13): sin casillas, el tratamiento es precontractual. Texto idéntico al de `LeadForm`. */}
            <p data-testid={tid("privacy")} className="text-[13px] leading-relaxed text-muted">
              <strong className="font-semibold text-ink">Responsable:</strong> Alcasi Systems, S.L.{" "}
              <strong className="font-semibold text-ink">Finalidad:</strong> responder a tu solicitud y preparar un
              presupuesto. <strong className="font-semibold text-ink">Legitimación:</strong> medidas precontractuales a
              petición tuya. <strong className="font-semibold text-ink">Destinatarios:</strong> proveedores de alojamiento,
              correo y CRM (Google Firebase, Vercel, Supabase, one.com y, si está activado, Telegram) como encargados del
              tratamiento y, solo si aceptas las cookies, Google y Meta para medir campañas; no se ceden a terceros salvo
              obligación legal. Los datos se alojan en Google Firebase (EE. UU.) con garantías adecuadas.{" "}
              <strong className="font-semibold text-ink">Derechos:</strong> acceso, rectificación, supresión y otros en
              hi@actiondev.es. Más información en la{" "}
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-ink underline underline-offset-2 ${focusRing}`}
              >
                Política de privacidad
              </a>
              .
            </p>

            {status === "error" && (
              <div data-testid={tid("error")} role="alert" className="grid gap-3 border-[3px] border-ink p-3.5">
                <p className="text-[15px]">No se ha podido enviar. Escríbenos por WhatsApp y te atendemos igual</p>
                <a
                  href={whatsappHref(whatsappTextForNeed(need))}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={tid("whatsapp")}
                  className={`${buttonBase} min-h-14 bg-ink text-paper hover:bg-lime hover:text-ink active:bg-lime active:text-ink`}
                >
                  Escribir por WhatsApp
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              data-testid={tid("submit")}
              className={`${buttonBase} bg-lime text-ink hover:bg-ink hover:text-lime active:bg-ink active:text-lime disabled:opacity-50`}
            >
              {sending ? "Enviando…" : "Enviar mi proyecto"}
            </button>
            <p className="text-center text-[15px]">
              Primera reunión gratis y sin compromiso. Te respondemos en 24 horas laborables.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
