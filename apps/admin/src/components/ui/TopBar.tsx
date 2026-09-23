import Link from "next/link";
import { logout } from "@/app/(protected)/logout/actions";

export function TopBar({ email }: { email: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/posts" className="text-sm font-semibold tracking-tight text-foreground">
          Action — Admin
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>{email}</span>
          <form action={logout}>
            <button type="submit" className="hover:text-foreground">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
