import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { leadFromDoc, sortLeads } from "@/lib/leads";
import { buildLeadsCsv } from "@/lib/lead-csv";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const snapshot = await adminDb().collection("leads").get();
  const csv = buildLeadsCsv(sortLeads(snapshot.docs.map(leadFromDoc)));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
