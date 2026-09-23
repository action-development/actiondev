import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components y Server Actions. Usa la sesión
 * real (cookies) para que RLS aplique como usuario `authenticated`, nunca
 * `service_role` — no hace falta en runtime, la policy de escritura ya
 * filtra por email en la base de datos.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` desde un Server Component (no una Server Action ni
            // route handler) no puede escribir cookies — se ignora porque
            // el refresco de sesión ya lo cubre el layout protegido en cada
            // navegación real.
          }
        },
      },
    },
  );
}
