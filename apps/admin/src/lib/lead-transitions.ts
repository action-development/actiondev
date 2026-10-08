import { LEAD_STATUSES, type Lead, type LeadStatus } from "@actiondev/shared";

/** Motivos de pérdida del select. «Otro» exige texto libre. */
export const LOST_REASONS = [
  "Presupuesto",
  "Sin respuesta",
  "Eligió a otro",
  "No encaja",
  "Spam",
  "Otro",
] as const;

/** Estados que implican que el lead ya está cualificado (fijan `qualifiedAt`). */
const QUALIFYING: readonly LeadStatus[] = ["qualified", "meeting", "proposal", "won"];

export interface StatusChangeInput {
  status: unknown;
  /** Euros sin IVA. Obligatorio si `status === "won"`. */
  value?: unknown;
  /** Obligatorio si `status === "lost"`. */
  lostReason?: unknown;
}

export type StatusChangeResult =
  | { ok: true; set: Record<string, string | number>; unset: string[] }
  | { ok: false; error: string };

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

/**
 * Calcula, sin tocar Firestore, qué campos escribir y cuáles borrar al cambiar
 * el estado de un lead. Valida todo: el cliente no es de fiar.
 */
export function planStatusChange(
  current: Pick<Lead, "status" | "qualifiedAt">,
  input: StatusChangeInput,
  nowIso: string,
): StatusChangeResult {
  if (!isLeadStatus(input.status)) return { ok: false, error: "Estado no válido." };
  const status = input.status;

  const set: Record<string, string | number> = { status, statusUpdatedAt: nowIso };
  const unset: string[] = [];

  if (QUALIFYING.includes(status) && !current.qualifiedAt) {
    set.qualifiedAt = nowIso;
  }

  if (status === "won") {
    const raw = input.value;
    const value = typeof raw === "string" ? Number(raw.trim().replace(",", ".")) : raw;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return { ok: false, error: "Indica el importe en euros sin IVA (mayor que 0)." };
    }
    set.value = Math.round(value * 100) / 100;
    set.wonAt = nowIso;
  } else {
    // Si deja de estar ganado, la conversión «Cliente ganado» ya no vale.
    unset.push("wonAt", "value");
  }

  if (status === "lost") {
    const reason = typeof input.lostReason === "string" ? input.lostReason.trim() : "";
    if (!reason) return { ok: false, error: "Indica el motivo de la pérdida." };
    if (reason.length > 300) return { ok: false, error: "El motivo es demasiado largo." };
    set.lostReason = reason;
  } else {
    unset.push("lostReason");
  }

  return { ok: true, set, unset };
}
