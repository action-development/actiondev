"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(protected)/logout/actions";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active ? "text-foreground" : "text-muted hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}

export function TopBar({ email }: { email: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-6">
          <Link href="/posts" className="text-sm font-semibold tracking-tight text-foreground">
            Action — Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink href="/posts">Blog</NavLink>
            <NavLink href="/leads">Leads</NavLink>
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
