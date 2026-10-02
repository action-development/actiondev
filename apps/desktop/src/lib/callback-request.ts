/**
 * Firebase (SDK web + Firestore, ~130 KB gz) se descarga SOLO cuando hace
 * falta, con `import()`. Con el import estático viajaba en el chunk de
 * /contact, y como el Header enlaza a /contact y `<Link>` precarga los chunks
 * de sus destinos, se bajaba en casi todas las páginas del sitio para un
 * formulario que casi nadie abre (auditoría de cargas 2026-10).
 */
const loadBackend = () => Promise.all([import("firebase/firestore"), import("@/lib/firebase/client")]);

/**
 * Empieza a descargar Firebase sin esperar a nada. La llama `CallbackForm` al
 * montarse —al abrir el "llámame"—: mientras el visitante teclea el teléfono,
 * el SDK ya está llegando, y al enviar no hay espera extra.
 */
export function preloadCallbackBackend(): void {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;
  // Si falla, que falle en `requestCallback`, que es quien enseña el error.
  void loadBackend().catch(() => {});
}

/**
 * Solicitud de "llámame tú" desde /contact — crea un documento en `leads`
 * con la `apiKey` web (las reglas de Firestore solo permiten `create` desde
 * un cliente sin sesión, nunca leer lo ya guardado). Sin Firebase
 * configurado: en desarrollo no hace nada; en producción LANZA, porque dar
 * el lead por enviado sin guardarlo es perderlo sin que nadie se entere.
 */
export async function requestCallback(phone: string, notes: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Firebase no configurado: el lead no se puede guardar");
    }
    console.info("[callback-request] Firebase no configurado, no se guarda:", { phone, notes });
    return;
  }

  const [{ addDoc, collection }, { getDb }] = await loadBackend();
  await addDoc(collection(getDb(), "leads"), {
    phone,
    notes,
    status: "new",
    createdAt: new Date().toISOString(),
  });
}
