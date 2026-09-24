/**
 * Seed one-off: asigna el custom claim `role: "admin"` al usuario de
 * Firebase Auth existente. Necesario tras migrar apps/admin y el portal de
 * clientes de "email hardcodeado" a custom claims — ejecutar ANTES de
 * desplegar ese cambio, o el admin se queda sin acceso.
 *
 * Uso: npx tsx scripts/set-admin-claim.ts hi@actiondev.es
 */
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Uso: npx tsx scripts/set-admin-claim.ts <email>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

initializeApp({
  projectId,
  credential:
    clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault(),
});

async function main() {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role: "admin" });
  console.log(`role:"admin" asignado a ${email} (uid ${user.uid}).`);
  console.log("El usuario debe volver a iniciar sesión para que el claim tenga efecto.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
