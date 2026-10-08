import { LEGAL_UPDATED, SITE_URL } from "@/lib/seo";
import type { ParsedLead } from "./parse";

/**
 * Guardado de leads en Firestore por REST: sin SDK y sin cuenta de servicio
 * (esta app NUNCA lleva credenciales de Admin, ver `[SECURITY]`). Es la misma
 * puerta pública que usaba el SDK web: la `apiKey` web + las reglas de
 * `firestore.rules`, que solo permiten `create` en `leads`.
 */

type FirestoreValue = { stringValue: string } | { mapValue: { fields: Record<string, FirestoreValue> } };

const str = (stringValue: string): FirestoreValue => ({ stringValue });

/**
 * Campos tipados del documento. SOLO claves del tipo `Lead` (las reglas llevan
 * un `hasOnly` con ellas) y sin valores vacíos: `company` y `attribution` solo
 * si vienen. `id` no es un campo (es el ID del documento).
 */
export function buildLeadFields(lead: ParsedLead, createdAt = new Date().toISOString()): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {
    status: str("new"),
    createdAt: str(createdAt),
    source: str(lead.source),
    phone: str(lead.phone),
    notes: str(lead.notes),
    consent: str(lead.consent),
    privacyVersion: str(LEGAL_UPDATED),
  };

  const optional = {
    name: lead.name,
    email: lead.email,
    company: lead.company,
    need: lead.need,
    stage: lead.stage,
    budget: lead.budget,
    contactPreference: lead.contactPreference,
  } as const;
  for (const [key, value] of Object.entries(optional)) {
    if (value) fields[key] = str(value);
  }

  const attribution = Object.entries(lead.attribution).filter(([, v]) => !!v);
  if (attribution.length > 0) {
    fields.attribution = {
      mapValue: { fields: Object.fromEntries(attribution.map(([k, v]) => [k, str(v as string)])) },
    };
  }

  return fields;
}

export function isFirestoreConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

function leadsCollectionUrl(documentId?: string): string {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || !key) throw new Error("Firebase no configurado");
  const id = documentId ? `documentId=${encodeURIComponent(documentId)}&` : "";
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/leads?${id}key=${encodeURIComponent(key)}`;
}

function createRequest(url: string, lead: ParsedLead, createdAt?: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Una clave web con restricción de referer rechaza peticiones sin él: se
      // identifica la web propia (la restricción es de la clave, no un secreto).
      Referer: `${SITE_URL}/`,
    },
    body: JSON.stringify({ fields: buildLeadFields(lead, createdAt) }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
}

async function failure(response: Response): Promise<Error> {
  // Cuerpo recortado y sin datos del lead: solo el motivo de Google.
  const detail = (await response.text().catch(() => "")).slice(0, 300);
  return new Error(`Firestore ${response.status}: ${detail}`);
}

/** Crea el lead y devuelve el ID del documento (último segmento de `name`). Lanza si Firestore falla. */
export async function saveLead(lead: ParsedLead, createdAt?: string): Promise<string> {
  const response = await createRequest(leadsCollectionUrl(), lead, createdAt);
  if (!response.ok) throw await failure(response);

  const doc = (await response.json()) as { name?: string };
  const id = doc.name?.split("/").pop();
  if (!id) throw new Error("Firestore no devolvió el ID del documento");
  return id;
}

/** IDs deterministas: letras, dígitos, `_` y `-` (nada de `/`, que abriría otra ruta). */
const DOC_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Crea el lead con un ID FIJO solo si no existe (idempotencia de los leads de
 * Meta: `meta_<leadgen_id>`). `createDocument` con `documentId` lleva la
 * precondición «no existe»: las reglas validan primero el documento y, si es
 * válido y el ID ya está, Firestore responde 409 ALREADY_EXISTS (comprobado en
 * el emulador). Sin sesión de admin no se puede leer `leads`: el 409 es la
 * única forma de saber que ya estaba. Lanza ante cualquier otro error.
 */
export async function createLeadWithId(
  lead: ParsedLead,
  documentId: string,
  createdAt: string,
): Promise<"created" | "exists"> {
  if (!DOC_ID_RE.test(documentId)) throw new Error("ID de documento no válido");
  const response = await createRequest(leadsCollectionUrl(documentId), lead, createdAt);
  if (response.ok) return "created";
  if (response.status === 409) return "exists";
  throw await failure(response);
}
