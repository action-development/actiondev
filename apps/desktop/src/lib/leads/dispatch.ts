import "server-only";
import { forwardLeadToErp } from "./erp";
import { notifyLead } from "./notify";
import type { ParsedLead } from "./parse";

/**
 * Lo que pasa DESPUÉS de guardar un lead nuevo en Firestore: aviso (email y
 * Telegram) y copia en el ERP, en paralelo y sin lanzar nunca (cada uno
 * registra su propio fallo). Lo comparten `POST /api/lead` (dentro de
 * `after()`) y la entrada de leads de Meta (`lib/leads/meta-ingest.ts`), para
 * que todos los leads sigan el MISMO camino.
 */
export function dispatchLead(lead: ParsedLead, id: string, createdAt: string) {
  return Promise.allSettled([notifyLead(lead, id), forwardLeadToErp(lead, id, createdAt)]);
}
