import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDevBypass, DEV_BYPASS_EMAIL } from "@/lib/dev-bypass-auth";
import { TopBar } from "@/components/ui/TopBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⚠️ Bypass temporal mientras Supabase no está conectado — ver
  // lib/dev-bypass-auth.ts. Quitar este bloque al conectar Supabase real.
  if (await isDevBypass()) {
    return (
      <>
        <TopBar email={DEV_BYPASS_EMAIL} />
        <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">{children}</main>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <TopBar email={user.email ?? ""} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">{children}</main>
    </>
  );
}
