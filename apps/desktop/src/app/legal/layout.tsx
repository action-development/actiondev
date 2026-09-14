import Link from "next/link";
import { BUSINESS, LEGAL_ENTITY } from "@/lib/seo";

/**
 * Chrome compartido de /legal/*.
 *
 * Server component puro: sin GSAP, sin Lenis, sin "use client". Estas páginas
 * existen para ser leídas y verificadas (organismos públicos, compliance),
 * no para lucirse — la carga tiene que ser instantánea y el texto copiable.
 */

const LEGAL_NAV = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacy", label: "Privacidad" },
  { href: "/legal/terms", label: "Términos" },
  { href: "/legal/cookies", label: "Cookies" },
] as const;

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const year = new Date().getFullYear();

  return (
    <>
      <header className="border-b border-border">
        <div className="container-editorial flex flex-wrap items-center justify-between gap-4 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Action
            </span>
          </Link>
          <nav aria-label="Documentos legales">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em]">
              {LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" className="container-editorial pb-24 pt-12 md:pt-16">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="container-editorial flex flex-col gap-2 py-10 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <p>
            &copy; {year} {BUSINESS.alternateName} — marca comercial de{" "}
            {LEGAL_ENTITY.name} · CIF {LEGAL_ENTITY.taxId}
          </p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-accent">
              {BUSINESS.email}
            </a>{" "}
            · {BUSINESS.phoneDisplay}
          </p>
        </div>
      </footer>
    </>
  );
}
