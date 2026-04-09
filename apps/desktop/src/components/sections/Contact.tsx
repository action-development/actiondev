"use client";

export function Contact() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Get in touch
        </h2>
        <p className="mb-16 text-4xl font-bold tracking-tight md:text-6xl">
          Let&apos;s build
          <br />
          something <span className="text-accent">great</span>
        </p>

        <form className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <input
              type="text"
              placeholder="Name"
              className="rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-colors focus:border-accent"
            />
            <input
              type="email"
              placeholder="Email"
              className="rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <input
            type="text"
            placeholder="Subject"
            className="w-full rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-colors focus:border-accent"
          />
          <textarea
            placeholder="Your message"
            rows={6}
            className="w-full resize-none rounded-xl border border-border bg-transparent px-5 py-4 text-sm outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-8 py-4 text-sm font-medium text-background transition-transform duration-300 hover:scale-105"
          >
            Send message
          </button>
        </form>
      </div>
    </section>
  );
}
