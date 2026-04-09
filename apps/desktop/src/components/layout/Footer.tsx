import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} Action. All rights reserved.
        </p>

        <div className="flex gap-6">
          {["Twitter", "Instagram", "LinkedIn", "Dribbble"].map((social) => (
            <Link
              key={social}
              href="#"
              className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
            >
              {social}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
