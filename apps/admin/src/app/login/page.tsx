"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Admin
        </h1>
        <p className="mt-2 text-sm text-muted">
          Acceso al panel de gestión del blog.
        </p>

        <form action={formAction} className="mt-10 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-foreground"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-foreground"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-[var(--radius-sm)] bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
