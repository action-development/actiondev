"use client";

import { useEffect, useRef, useState } from "react";
import { readStoredConsent, trackLead } from "@actiondev/shared";
import { PhoneIcon } from "@/components/icons/channel-icons";
import { useLocale, useT } from "@/lib/i18n";
import { isValidPhone } from "@/lib/leads/validation";

/**
 * "Llámame tú": el visitante deja un teléfono y el estudio le llama. Envía a
 * `POST /api/lead` (`source: "callback_form"`), que lo guarda en `leads` por
 * REST y avisa por email/Telegram: el cliente ya no carga el SDK de Firebase.
 *
 * Solo se monta al abrirla (portero de la calle o su botón en el HUD), y al
 * montarse enfoca el teléfono: quien pulsó el portero viene a escribirlo.
 * Notas y enviar aparecen al empezar a escribir, como antes.
 */
export function CallbackForm() {
  const t = useT();
  const { locale } = useLocale();
  const phoneRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef(0);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "invalid">("idle");
  const trimmed = phone.trim();

  // Al abrirse: foco al teléfono (quien pulsó el portero viene a escribirlo) y
  // arranca el reloj del antispam (`elapsedMs`).
  useEffect(() => {
    phoneRef.current?.focus();
    mountedAt.current = performance.now();
  }, []);

  // El éxito se enseña (y se mide) solo con el lead YA guardado: el endpoint
  // responde 502 si Firestore falla, y entonces se muestra el error.
  const submit = async () => {
    if (!trimmed || status === "sending" || status === "sent") return;
    if (!isValidPhone(trimmed)) {
      setStatus("invalid");
      phoneRef.current?.focus();
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "callback_form",
          phone: trimmed,
          notes: notes.trim() || undefined,
          attribution: { landingPath: window.location.pathname },
          consent: readStoredConsent() ?? "unknown",
          website: honeypot,
          elapsedMs: Math.round(performance.now() - mountedAt.current),
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; id?: string } | null;
      if (!response.ok || data?.ok !== true) throw new Error(`lead ${response.status}`);

      // La conversión solo sale con el id real del lead guardado. Un 200 sin
      // `id` es un envío descartado como bot: se confirma igual, sin medir.
      const leadId = data.id;
      if (leadId) {
        trackLead(
          {
            lead_id: leadId,
            transaction_id: leadId,
            lead_source: "callback_form",
            lead_need: "not_asked",
            lead_budget: "not_asked",
            page_path: window.location.pathname,
          },
          { phone_number: trimmed },
        );
      }
      setStatus("sent");
    } catch (error) {
      console.error("[contact] no se pudo guardar el lead:", error);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p data-testid="callback-success" role="status" className="animate-fade-in text-sm text-accent">
        {t.contact.callbackSuccess}
      </p>
    );
  }

  return (
    <form
      data-testid="callback-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="relative animate-fade-in"
    >
      <div
        className="flex cursor-text items-center gap-2 border border-border px-3 py-2 transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] focus-within:border-accent"
        onClick={() => phoneRef.current?.focus()}
      >
        <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
        <label htmlFor="contact-callback-phone" className="sr-only">
          {t.contact.callbackPlaceholder}
        </label>
        <input
          ref={phoneRef}
          id="contact-callback-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t.contact.callbackPlaceholder}
          aria-invalid={status === "invalid"}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
        {trimmed && (
          <button
            type="submit"
            disabled={status === "sending"}
            aria-busy={status === "sending"}
            className="holo-btn holo-btn-solid holo-btn-sm shrink-0 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">{t.contact.callbackCta}</span>
          </button>
        )}
      </div>

      {/* Honeypot: fuera de pantalla y del árbol accesible. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </label>
      </div>

      {status === "invalid" && (
        <p data-testid="callback-invalid" role="alert" className="mt-2 animate-fade-in text-xs text-foreground">
          {locale === "es"
            ? "Revisa el teléfono: necesitamos al menos 9 dígitos."
            : "Check the phone number: it needs at least 9 digits."}
        </p>
      )}

      {status === "error" && (
        <p data-testid="callback-error" role="alert" className="mt-2 animate-fade-in text-xs text-foreground">
          {t.contact.callbackError}
        </p>
      )}

      {trimmed && (
        <div className="mt-2 animate-fade-in">
          <label htmlFor="contact-callback-notes" className="sr-only">
            {t.contact.callbackNotesPlaceholder}
          </label>
          <textarea
            id="contact-callback-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t.contact.callbackNotesPlaceholder}
            rows={2}
            className="w-full resize-none border border-border bg-transparent px-3 py-2 text-xs text-foreground outline-none transition-colors duration-[var(--duration)] [transition-timing-function:var(--ease)] placeholder:text-muted focus:border-accent"
          />
        </div>
      )}
    </form>
  );
}
