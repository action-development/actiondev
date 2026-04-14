"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/data/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 z-50 w-full" role="banner">
      <div className="mx-auto max-w-7xl px-6 pt-4">
        <nav
          aria-label="Main navigation"
          className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/60 px-6 py-3.5 backdrop-blur-xl"
        >
          <Link href="/" aria-label="Action — Home" className="text-lg font-bold tracking-tight">
            ACTION<span className="text-accent">.</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex" role="list">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded-lg px-4 py-2 text-sm transition-all duration-300 ${
                      active
                        ? "bg-white/[0.06] text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/contact"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,122,61,0.25)]"
          >
            Let&apos;s talk
          </Link>
        </nav>
      </div>
    </header>
  );
}
