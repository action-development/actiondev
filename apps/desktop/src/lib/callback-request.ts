import { addDoc, collection } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

/**
 * Solicitud de "llámame tú" desde /contact — crea un documento en `leads`
 * con la `apiKey` web (las reglas de Firestore solo permiten `create` desde
 * un cliente sin sesión, nunca leer lo ya guardado). Sin Firebase
 * configurado en el entorno, no hace nada: no hay a dónde escribir todavía.
 */
export async function requestCallback(phone: string, notes: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[callback-request] Firebase no configurado, no se guarda:", { phone, notes });
    }
    return;
  }

  await addDoc(collection(getDb(), "leads"), {
    phone,
    notes,
    status: "new",
    createdAt: new Date().toISOString(),
  });
}
