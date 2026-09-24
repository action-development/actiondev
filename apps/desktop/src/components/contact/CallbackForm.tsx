"use client";

import { useEffect, useRef, useState } from "react";
import { requestCallback } from "@/lib/callback-request";
import { PhoneIcon } from "@/components/icons/channel-icons";
import { useT } from "@/lib/i18n";

/**
 * "Llámame tú": el visitante deja un teléfono y el estudio le llama. Es la
 * única escritura pública (`leads` en Firestore, ver `[BACKEND]`).
 *
 * Solo se monta al abrirla (portero de la calle o su botón en el HUD), y al
 * montarse enfoca el teléfono: quien pulsó el portero viene a escribirlo.
 * Notas y enviar aparecen al empezar a escribir, como antes.
 */
export function CallbackForm() {
  const t = useT();
  const phoneRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const trimmed = phone.trim();

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  const submit = () => {
    if (!trimmed || submitted) return;
    requestCallback(trimmed, notes.trim()).catch((error) => {
      console.error("[contact] no se pudo guardar el lead:", error);
    });
    setSubmitted(true);
  };

  if (submitted) {
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
        submit();
      }}
      className="animate-fade-in"
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
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
        {trimmed && (
          <button type="submit" className="holo-btn holo-btn-solid holo-btn-sm shrink-0">
            <span className="inline-flex items-center gap-2">{t.contact.callbackCta}</span>
          </button>
        )}
      </div>

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
