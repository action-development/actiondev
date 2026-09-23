"use server";

import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@actiondev/shared";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/session";

export async function setLeadStatus(id: string, status: LeadStatus) {
  await requireSessionUser();

  await adminDb().collection("leads").doc(id).update({ status });

  revalidatePath("/leads");
}

export async function deleteLead(id: string) {
  await requireSessionUser();

  await adminDb().collection("leads").doc(id).delete();

  revalidatePath("/leads");
}
