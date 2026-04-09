"use client";

import Link from "next/link";
import { navigation } from "@/data/navigation";

export function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ACTION<span className="text-accent">.</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-background transition-transform duration-300 hover:scale-105"
        >
          Let&apos;s talk
        </Link>
      </nav>
    </header>
  );
}
