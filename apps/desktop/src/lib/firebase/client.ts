import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Firestore para lectura pública de posts e inserción de leads. Sin sesión:
 * la `apiKey` web ya está limitada por las reglas de seguridad de Firestore
 * (`firestore.rules`) a `status == 'published'` en lectura y a `create` en
 * `leads`.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function getDb() {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getFirestore(app);
}
