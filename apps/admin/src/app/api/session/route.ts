import { NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE } from "@/lib/firebase/session";

/**
 * El login real ocurre en el navegador (Firebase Auth solo puede firmar con
 * email/password desde el cliente). Este endpoint canjea el ID token
 * resultante por una cookie de sesión httpOnly verificada con el Admin SDK.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;

  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Falta idToken." }, { status: 400 });
  }

  let sessionCookie: string;
  try {
    sessionCookie = await createSessionCookie(idToken);
  } catch {
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
