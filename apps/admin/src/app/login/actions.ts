"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEV_BYPASS_COOKIE, DEV_BYPASS_EMAIL, DEV_BYPASS_PASSWORD } from "@/lib/dev-bypass-auth";

export async function login(_prevState: string | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // ⚠️ Bypass temporal mientras Supabase no está conectado — ver
  // lib/dev-bypass-auth.ts. Quitar este bloque al conectar Supabase real.
  if (email === DEV_BYPASS_EMAIL && password === DEV_BYPASS_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(DEV_BYPASS_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/posts");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return "Email o contraseña incorrectos.";
  }

  redirect("/posts");
}
