import type { Lead } from "@actiondev/shared";
import type { DocumentSnapshot } from "firebase-admin/firestore";

export function leadFromDoc(doc: DocumentSnapshot): Lead {
  return { id: doc.id, ...(doc.data() as Omit<Lead, "id">) };
}
