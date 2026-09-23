import Link from "next/link";
import { logout } from "@/app/(protected)/logout/actions";

export function TopBar({ email }: { email: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-6">
          <Link href="/posts" className="text-sm font-semibold tracking-tight text-foreground">
            Action — Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <Link href="/posts" className="hover:text-foreground">
              Blog
            </Link>
            <Link href="/leads" className="hover:text-foreground">
              Leads
            </Link>
          </nav>
        </div>
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
