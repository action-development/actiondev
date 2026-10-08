"use client";

import { useState, useTransition } from "react";
import {
  LEAD_BUDGET_LABELS,
  LEAD_CONTACT_PREFERENCE_LABELS,
  LEAD_NEED_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatus,
} from "@actiondev/shared";
import { setLeadStatus, deleteLead } from "@/app/(protected)/leads/actions";
import { LOST_REASONS } from "@/lib/lead-transitions";
import { formatAbsolute, isUncontacted, relativeTime, whatsappUrl } from "@/lib/leads";

export function LeadsList({ leads, nowIso }: { leads: Lead[]; nowIso: string }) {
  const now = Date.parse(nowIso);
  return (
    <ul className="divide-y divide-border border-t border-border">
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} now={now} />
      ))}
    </ul>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[var(--radius-sm)] border border-border px-2 py-0.5 text-xs text-muted">{children}</span>
  );
}

const linkClass = "text-foreground underline underline-offset-2 hover:text-muted";

function LeadRow({ lead, now }: { lead: Lead; now: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<LeadStatus | null>(null);
  const [value, setValue] = useState("");
  const [reasonKind, setReasonKind] = useState<string>(LOST_REASONS[0]);
  const [reasonText, setReasonText] = useState("");

  const attr = lead.attribution;
  const urgent = isUncontacted(lead, now);
  const wa = whatsappUrl(lead.phone);
  const title = lead.name?.trim() || "Sin nombre";

  function submit(status: LeadStatus, extra?: { value?: string; lostReason?: string }) {
    setError(null);
    startTransition(async () => {
      const result = await setLeadStatus(lead.id, { status, ...extra });
      if (!result.ok) setError(result.error);
      else setPending(null);
    });
  }

  function onSelect(status: LeadStatus) {
    if (status === lead.status) return;
    if (status === "won" || status === "lost") {
      setPending(status);
      setError(null);
      return;
    }
    setPending(null);
    submit(status);
  }

  function confirmPending() {
    if (pending === "won") submit("won", { value });
    if (pending === "lost") {
      const lostReason = reasonKind === "Otro" ? reasonText.trim() : reasonText.trim() ? `${reasonKind}: ${reasonText.trim()}` : reasonKind;
      submit("lost", { lostReason });
    }
  }

  const fields: Array<[string, string | undefined]> = [
    ["Necesidad", lead.need && LEAD_NEED_LABELS[lead.need]],
    ["Presupuesto", lead.budget && LEAD_BUDGET_LABELS[lead.budget]],
    ["Etapa", lead.stage && LEAD_STAGE_LABELS[lead.stage]],
    ["Canal preferido", lead.contactPreference && LEAD_CONTACT_PREFERENCE_LABELS[lead.contactPreference]],
  ];

  return (
    <li className="flex flex-col gap-3 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium text-foreground">{title}</h2>
            {lead.company && <span className="text-sm text-muted">{lead.company}</span>}
            <span
              className={
                "shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-0.5 text-xs font-medium " +
                (lead.status === "new" ? "border-foreground text-foreground" : "border-border text-muted")
              }
            >
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {relativeTime(lead.createdAt, now)} · {formatAbsolute(lead.createdAt)}
          </p>
        </div>
        {urgent && (
          <span className="rounded-[var(--radius-sm)] bg-danger px-2.5 py-1 text-xs font-semibold text-white">
            Sin contactar · {relativeTime(lead.createdAt, now).replace("hace ", "")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {lead.phone && (
          <>
            <a href={`tel:${lead.phone}`} className={linkClass}>{lead.phone}</a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp</a>}
          </>
        )}
        {lead.email && <a href={`mailto:${lead.email}`} className={linkClass}>{lead.email}</a>}
      </div>

      {fields.some(([, v]) => v) && (
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {fields.map(([label, v]) =>
            v ? (
              <div key={label} className="flex gap-2">
                <dt className="text-muted">{label}:</dt>
                <dd className="text-foreground">{v}</dd>
              </div>
            ) : null,
          )}
        </dl>
      )}

      {lead.notes && <p className="whitespace-pre-wrap text-sm text-foreground">{lead.notes}</p>}

      <div className="flex flex-wrap gap-1.5">
        {lead.source && <Tag>{LEAD_SOURCE_LABELS[lead.source]}</Tag>}
        {attr?.utmCampaign && <Tag>Campaña: {attr.utmCampaign}</Tag>}
        {attr?.utmTerm && <Tag>Término: {attr.utmTerm}</Tag>}
        {attr?.gclid && <Tag>gclid</Tag>}
        {attr?.fbclid && <Tag>fbclid</Tag>}
        {lead.status === "won" && typeof lead.value === "number" && (
          <Tag>{lead.value.toLocaleString("es-ES")} € sin IVA</Tag>
        )}
        {lead.status === "lost" && lead.lostReason && <Tag>Motivo: {lead.lostReason}</Tag>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={lead.status}
          disabled={isPending}
          aria-label="Estado del lead"
          onChange={(event) => onSelect(event.target.value as LeadStatus)}
          className="rounded-[var(--radius-sm)] border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground disabled:opacity-40"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>{LEAD_STATUS_LABELS[status]}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`¿Eliminar el lead de ${lead.name?.trim() || lead.phone || "este contacto"}?`)) return;
            startTransition(async () => {
              const result = await deleteLead(lead.id);
              if (!result.ok) setError(result.error);
            });
          }}
          className="rounded-[var(--radius-sm)] border border-border px-2.5 py-1.5 text-sm text-muted hover:text-danger disabled:opacity-40"
        >
          Eliminar
        </button>
      </div>

      {pending && (
        <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-3 text-sm">
          {pending === "won" ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Importe del proyecto (€, sin IVA)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-40 rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1.5"
              />
            </label>
          ) : (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">Motivo</span>
                <select
                  value={reasonKind}
                  onChange={(e) => setReasonKind(e.target.value)}
                  className="rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1.5"
                >
                  {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">{reasonKind === "Otro" ? "Detalle (obligatorio)" : "Detalle (opcional)"}</span>
                <input
                  type="text"
                  maxLength={200}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  className="w-56 rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1.5"
                />
              </label>
            </>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={confirmPending}
            className="rounded-[var(--radius-sm)] bg-foreground px-3 py-1.5 text-background disabled:opacity-40"
          >
            Confirmar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPending(null)}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-muted"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </li>
  );
}
