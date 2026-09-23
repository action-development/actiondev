"use client";

import { useTransition } from "react";
import type { Lead, LeadStatus } from "@actiondev/shared";
import { setLeadStatus, deleteLead } from "@/app/(protected)/leads/actions";

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  closed: "Cerrado",
};

export function LeadsList({ leads }: { leads: Lead[] }) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} />
      ))}
    </ul>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <a href={`tel:${lead.phone}`} className="text-lg font-medium text-foreground">
            {lead.phone}
          </a>
          <span
            className={
              "shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium " +
              (lead.status === "new"
                ? "border-foreground text-foreground"
                : "border-border text-muted")
            }
          >
            {STATUS_LABEL[lead.status]}
          </span>
        </div>
        {lead.notes && <p className="mt-1 text-sm text-muted">{lead.notes}</p>}
        <p className="mt-1 text-xs text-muted">
          {new Date(lead.createdAt).toLocaleString("es-ES")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <select
          value={lead.status}
          disabled={isPending}
          onChange={(event) => {
            const status = event.target.value as LeadStatus;
            startTransition(() => {
              void setLeadStatus(lead.id, status);
            });
          }}
          className="rounded-[var(--radius-sm)] border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground disabled:opacity-40"
        >
          {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`¿Eliminar el lead de ${lead.phone}?`)) return;
            startTransition(() => {
              void deleteLead(lead.id);
            });
          }}
          className="rounded-[var(--radius-sm)] border border-border px-2.5 py-1.5 text-sm text-muted hover:text-danger disabled:opacity-40"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
