"use client";

import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  return (
    <section id="testimonials" className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          What they say
        </h2>
        <p className="mb-16 text-4xl font-bold tracking-tight md:text-6xl">
          Testimonials
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.id}
              className="rounded-2xl border border-border p-8"
            >
              <p className="mb-6 text-lg leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <footer className="flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="h-10 w-10 rounded-full bg-border" />
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
