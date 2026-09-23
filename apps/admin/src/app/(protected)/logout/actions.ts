"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEV_BYPASS_COOKIE } from "@/lib/dev-bypass-auth";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_BYPASS_COOKIE);

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
