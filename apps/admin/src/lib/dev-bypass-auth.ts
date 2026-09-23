/**
 * ⚠️ BYPASS TEMPORAL — BORRAR ANTES DE DESPLEGAR A PRODUCCIÓN ⚠️
 *
 * Login hardcodeado para poder navegar el panel mientras Supabase no está
 * conectado (sin proyecto real todavía). NO usa Supabase Auth: compara
 * contra estas constantes y planta una cookie propia. No hay sesión de
 * Supabase real, así que las escrituras a `posts` (RLS) seguirán fallando
 * hasta que haya un proyecto Supabase real configurado en `.env.local`.
 *
 * Quitar este archivo y sus usos en `login/actions.ts` y
 * `(protected)/layout.tsx` en cuanto haya un usuario real creado en
 * Supabase Auth — ver CLAUDE.md `[SECURITY]`.
 */
import { cookies } from "next/headers";

export const DEV_BYPASS_EMAIL = "hi@actiondev.es";
export const DEV_BYPASS_PASSWORD = "admin123action";
export const DEV_BYPASS_COOKIE = "admin_dev_bypass";

export async function isDevBypass(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEV_BYPASS_COOKIE)?.value === "1";
}
