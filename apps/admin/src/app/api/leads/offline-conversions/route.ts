import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { leadFromDoc } from "@/lib/leads";
import { buildOfflineConversionsCsv } from "@/lib/lead-csv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const desde = new URL(request.url).searchParams.get("desde") ?? undefined;
  const now = new Date();
  const snapshot = await adminDb().collection("leads").get();
  const csv = buildOfflineConversionsCsv(snapshot.docs.map(leadFromDoc), { now, desde });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversiones-google-ads-${now.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
