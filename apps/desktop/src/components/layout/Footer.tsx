import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-6 py-16" role="contentinfo">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="text-lg font-bold tracking-tight">
            ACTION<span className="text-accent">.</span>
          </Link>
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} Action. All rights reserved.
          </p>
        </div>

        <nav aria-label="Social media">
          <div className="flex gap-6">
            {["Twitter", "Instagram", "LinkedIn", "Dribbble"].map((social) => (
              <Link
                key={social}
                href="#"
                aria-label={`Follow Action on ${social}`}
                className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
              >
                {social}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  );
}
