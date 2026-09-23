import type { Lead } from "@actiondev/shared";
import { adminDb } from "@/lib/firebase/admin";
import { leadFromDoc } from "@/lib/leads";
import { LeadsList } from "@/components/leads/LeadsList";

export default async function LeadsPage() {
  const snapshot = await adminDb().collection("leads").orderBy("createdAt", "desc").get();
  const leads: Lead[] = snapshot.docs.map(leadFromDoc);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Leads</h1>
        <p className="mt-2 text-sm text-muted">
          Números dejados en &quot;llámame tú&quot; desde /contact.
        </p>
      </div>

      {leads.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no ha dejado su número ningún visitante.
        </p>
      )}

      {leads.length > 0 && <LeadsList leads={leads} />}
    </div>
  );
}
