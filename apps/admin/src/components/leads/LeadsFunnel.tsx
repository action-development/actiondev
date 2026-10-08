import Link from "next/link";
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@actiondev/shared";
import type { LeadFilters } from "@/lib/leads";

function href(filters: LeadFilters): string {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("estado", filters.status);
  if (filters.source) qs.set("origen", filters.source);
  const s = qs.toString();
  return s ? `/leads?${s}` : "/leads";
}

export function LeadsFunnel({
  counts,
  filters,
}: {
  counts: Record<LeadStatus, number>;
  filters: LeadFilters;
}) {
  const chip = (active: boolean) =>
    "rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium " +
    (active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground");

  return (
    <section className="flex flex-col gap-4">
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {LEAD_STATUSES.map((status) => {
          const active = filters.status === status;
          return (
            <li key={status}>
              <Link
                href={href({ ...filters, status: active ? undefined : status })}
                aria-current={active ? "true" : undefined}
                className={
                  "flex flex-col rounded-[var(--radius-md)] border px-3 py-2 " +
                  (active ? "border-foreground" : "border-border hover:border-foreground")
                }
              >
                <span className="text-2xl font-semibold tabular-nums text-foreground">{counts[status]}</span>
                <span className="text-xs text-muted">{LEAD_STATUS_LABELS[status]}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Origen</span>
        <Link href={href({ ...filters, source: undefined })} className={chip(!filters.source)}>
          Todos
        </Link>
        {LEAD_SOURCES.map((source) => (
          <Link key={source} href={href({ ...filters, source })} className={chip(filters.source === source)}>
            {LEAD_SOURCE_LABELS[source]}
          </Link>
        ))}
        {(filters.status || filters.source) && (
          <Link href="/leads" className="ml-auto text-xs text-muted underline hover:text-foreground">
            Quitar filtros
          </Link>
        )}
      </div>
    </section>
  );
}
