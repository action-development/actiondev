/**
 * Reenvío one-off de los leads antiguos (colección `leads` de Firestore) al ERP
 * interno (`POST /api/leads/inbound`). Usa el MISMO `toErpPayload` que
 * `POST /api/lead`, y es idempotente: el ERP deduplica por `externalId` (el ID
 * del documento) y responde 200 `{duplicate:true}` si ya existía.
 *
 * Credenciales de Firestore: las de `firebase login` (`applicationDefault()`),
 * proyecto `action-dev-1a531` (mismo patrón que `seed-blog-posts.ts`;
 * `firebase-admin` se resuelve desde el `node_modules` de la raíz).
 *
 * Uso (desde la raíz del monorepo):
 *   LEAD_ERP_URL=https://actionerp.vercel.app/api/leads/inbound \
 *   LEAD_ERP_SECRET=... \
 *   npx tsx scripts/backfill-leads-to-erp.ts [--dry-run | --send]
 *
 *   --dry-run  (por defecto) solo cuenta e imprime los IDs; sin datos personales
 *              y sin llamar al ERP.
 *   --send     envía de verdad, uno a uno (exige LEAD_ERP_URL y LEAD_ERP_SECRET).
 */
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { toErpPayload, type ErpLeadInput } from "../apps/desktop/src/lib/leads/erp-payload";

const PROJECT_ID = "action-dev-1a531";
const TIMEOUT_MS = 8000;

async function send(url: string, secret: string, body: string): Promise<number | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-leads-secret": secret },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.status;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const sendMode = args.includes("--send");
  if (sendMode && args.includes("--dry-run")) {
    console.error("--send y --dry-run son incompatibles.");
    process.exit(1);
  }

  const url = process.env.LEAD_ERP_URL;
  const secret = process.env.LEAD_ERP_SECRET;
  if (sendMode && (!url || !secret)) {
    console.error("Faltan LEAD_ERP_URL y/o LEAD_ERP_SECRET en el entorno.");
    process.exit(1);
  }

  const db = getFirestore(initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() }));
  const snapshot = await db.collection("leads").orderBy("createdAt", "asc").get();

  const items: { id: string; body: string }[] = [];
  let skipped = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data() as ErpLeadInput & { createdAt?: string };
    if (!data.source || !data.phone || !data.createdAt) {
      skipped++;
      console.warn(`- ${doc.id}: sin source/phone/createdAt, se omite`);
      continue;
    }
    items.push({ id: doc.id, body: JSON.stringify(toErpPayload(data, doc.id, data.createdAt)) });
  }

  console.log(`${items.length} leads para reenviar (${skipped} omitidos) de ${snapshot.size}.`);
  if (!sendMode) {
    for (const { id } of items) console.log(`  ${id}`);
    console.log("Dry-run: no se ha enviado nada. Usa --send para enviar.");
    return;
  }

  let created = 0;
  let duplicates = 0;
  let failed = 0;
  for (const { id, body } of items) {
    let status = await send(url!, secret!, body);
    if (status === null || status >= 500) status = await send(url!, secret!, body);

    if (status === 201) created++;
    else if (status === 200) duplicates++;
    else {
      failed++;
      console.error(`✗ ${id}: status=${status ?? "network"}`);
      // Credenciales o configuración del ERP mal: seguir sería inútil.
      if (status === 401 || status === 503) break;
    }
  }
  console.log(`Creados ${created}, duplicados ${duplicates}, fallidos ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
