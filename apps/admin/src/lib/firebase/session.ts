import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** Único usuario admitido — un solo usuario, sin auto-registro (ver CLAUDE.md [SECURITY]). */
const ALLOWED_EMAIL = "hi@actiondev.es";

export async function createSessionCookie(idToken: string): Promise<string> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (decoded.email !== ALLOWED_EMAIL) {
    throw new Error("Cuenta no autorizada.");
  }
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

export async function getSessionUser(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    if (decoded.email !== ALLOWED_EMAIL) return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<{ email: string }> {
  const user = await getSessionUser();
  if (!user) throw new Error("No autenticado.");
  return user;
}
