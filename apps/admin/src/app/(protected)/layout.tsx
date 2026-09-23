import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { TopBar } from "@/components/ui/TopBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopBar email={user.email} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">{children}</main>
    </>
  );
}
