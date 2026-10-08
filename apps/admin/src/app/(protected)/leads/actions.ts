"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/session";
import { normalizeLeadData } from "@/lib/leads";
import { planStatusChange } from "@/lib/lead-transitions";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setLeadStatus(
  id: string,
  input: { status: string; value?: string | number; lostReason?: string },
): Promise<ActionResult> {
  await requireSessionUser();
  if (typeof id !== "string" || !id) return { ok: false, error: "Lead no válido." };

  const ref = adminDb().collection("leads").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "El lead ya no existe." };

  const current = normalizeLeadData(snap.id, snap.data() as Record<string, unknown>);
  const plan = planStatusChange(current, input, new Date().toISOString());
  if (!plan.ok) return plan;

  const update: Record<string, unknown> = { ...plan.set };
  for (const field of plan.unset) update[field] = FieldValue.delete();
  await ref.update(update);

  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  await requireSessionUser();
  if (typeof id !== "string" || !id) return { ok: false, error: "Lead no válido." };

  await adminDb().collection("leads").doc(id).delete();

  revalidatePath("/leads");
  return { ok: true };
}
