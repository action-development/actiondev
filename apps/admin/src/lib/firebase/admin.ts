import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK — server actions y route handlers, nunca el navegador.
 * En local usa las credenciales de usuario de `gcloud`/Firebase CLI
 * (`applicationDefault()`, ya presentes tras `firebase login`); en
 * producción (Vercel) usa la cuenta de servicio de las tres env vars
 * `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` cuando estén definidas.
 */
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    projectId,
    credential:
      clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault(),
  });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
