import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Lectura pública de posts publicados. Sin sesión ni cookies: la `anon key`
 * ya está limitada por RLS a `status = 'published'`, así que un cliente
 * simple basta — no hace falta `@supabase/ssr` aquí.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
