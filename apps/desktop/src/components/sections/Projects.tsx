"use client";

import { projects } from "@/data/projects";

export function Projects() {
  return (
    <section id="projects" className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-muted">
          Selected Work
        </h2>
        <p className="mb-16 text-4xl font-bold tracking-tight md:text-6xl">
          Projects
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-border"
            >
              {/* Image placeholder - replace with next/image */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />

              <div className="absolute bottom-0 left-0 p-8">
                <span className="mb-2 inline-block text-xs uppercase tracking-widest text-accent">
                  {project.category}
                </span>
                <h3 className="text-2xl font-bold">{project.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {project.description}
                </p>
                <div className="mt-3 flex gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
