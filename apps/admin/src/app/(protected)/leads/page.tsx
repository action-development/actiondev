import { adminDb } from "@/lib/firebase/admin";
import {
  applyLeadFilters,
  funnelCounts,
  leadFromDoc,
  parseLeadFilters,
  sortLeads,
} from "@/lib/leads";
import { LeadsList } from "@/components/leads/LeadsList";
import { LeadsFunnel } from "@/components/leads/LeadsFunnel";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseLeadFilters(await searchParams);

  const snapshot = await adminDb().collection("leads").get();
  const all = sortLeads(snapshot.docs.map(leadFromDoc));

  const bySource = applyLeadFilters(all, { source: filters.source });
  const counts = funnelCounts(bySource);
  const visible = applyLeadFilters(bySource, { status: filters.status });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Leads</h1>
          <p className="mt-2 text-sm text-muted">Seguimiento comercial de los contactos que llegan por la web y las campañas.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/admin/api/leads/offline-conversions"
            className="rounded-[var(--radius-sm)] border border-foreground px-3 py-1.5 text-foreground hover:bg-surface"
          >
            Descargar conversiones para Google Ads
          </a>
          <a
            href="/admin/api/leads/export"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-muted hover:text-foreground"
          >
            Exportar todos (CSV)
          </a>
        </div>
      </div>

      <LeadsFunnel counts={counts} filters={filters} />

      {visible.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-sm text-muted">
          {all.length === 0 ? "Todavía no ha llegado ningún lead." : "Ningún lead coincide con los filtros."}
        </p>
      )}

      {visible.length > 0 && <LeadsList leads={visible} nowIso={new Date().toISOString()} />}
    </div>
  );
}
