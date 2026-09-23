"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { BlogPost } from "@actiondev/shared";
import { BlockEditor } from "./BlockEditor";
import { slugify, estimateReadingTime, type PostWriteInput } from "@/lib/posts";
import { createPost, updatePost, deletePost } from "@/app/(protected)/posts/actions";

const EMPTY: PostWriteInput = {
  slug: "",
  title: "",
  metaDescription: "",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  readingTime: 1,
  h1: "",
  excerpt: "",
  content: [],
  status: "draft",
};

export function PostForm({ post }: { post?: BlogPost }) {
  const [values, setValues] = useState<PostWriteInput>(post ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function field<K extends keyof PostWriteInput>(key: K, value: PostWriteInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setValues((v) => ({
      ...v,
      title,
      h1: title,
      slug: slugTouched ? v.slug : slugify(title),
    }));
  }

  function buildPayload(status: PostWriteInput["status"]): PostWriteInput {
    return {
      ...values,
      status,
      h1: values.title,
      metaDescription: values.metaDescription.trim() || values.excerpt,
      readingTime: estimateReadingTime(values.content),
    };
  }

  function submit(status: PostWriteInput["status"]) {
    if (!values.title.trim()) {
      setError("Ponle un título al artículo antes de guardar.");
      return;
    }
    setError(null);
    const payload = buildPayload(status);
    startTransition(async () => {
      try {
        if (post) await updatePost(post.id, payload);
        else await createPost(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el artículo.");
      }
    });
  }

  function remove() {
    if (!post) return;
    if (!confirm("¿Eliminar este artículo? No se puede deshacer.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePost(post.id, post.slug);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar el artículo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-14">
      <div>
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          ← Volver a artículos
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {post ? "Editar artículo" : "Nuevo artículo"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Rellena el título y escribe el texto. El resto se rellena solo.
        </p>
      </div>

      <section className="flex flex-col gap-8">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium text-foreground">Título</span>
          <input
            value={values.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ej: Cinco señales de que tu web está perdiendo clientes"
            className="rounded-[var(--radius-sm)] border border-border px-4 py-3 text-lg outline-none focus:border-foreground"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-base font-medium text-foreground">Resumen corto</span>
          <span className="text-sm text-muted">
            Una o dos frases. Es lo que se ve en el listado del blog, antes de entrar al
            artículo.
          </span>
          <textarea
            value={values.excerpt}
            onChange={(e) => field("excerpt", e.target.value)}
            rows={2}
            placeholder="Ej: Una web puede estar online y aun así perder clientes todos los días."
            className="resize-y rounded-[var(--radius-sm)] border border-border px-4 py-3 text-base outline-none focus:border-foreground"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-base font-medium text-foreground">Categoría</span>
          <span className="text-sm text-muted">Ej: Guías, SEO, Desarrollo de apps…</span>
          <input
            value={values.category}
            onChange={(e) => field("category", e.target.value)}
            className="max-w-sm rounded-[var(--radius-sm)] border border-border px-4 py-3 text-base outline-none focus:border-foreground"
          />
        </label>
      </section>

      <section className="flex flex-col gap-6 border-t border-border pt-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Texto del artículo
          </h2>
          <p className="mt-2 text-sm text-muted">
            Escríbelo por partes: párrafos de texto normal, subtítulos para separar
            secciones, listas y citas destacadas.
          </p>
        </div>
        <BlockEditor blocks={values.content} onChange={(content) => field("content", content)} />
      </section>

      <details className="group border-t border-border pt-8">
        <summary className="cursor-pointer text-sm font-medium text-muted marker:content-none hover:text-foreground">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span>{" "}
          Ajustes avanzados (fecha, enlace, buscadores…)
        </summary>

        <div className="mt-6 flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Fecha de publicación</span>
            <input
              type="date"
              value={values.date}
              onChange={(e) => field("date", e.target.value)}
              className="max-w-xs rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Enlace (URL)</span>
            <span className="text-sm text-muted">
              Se genera solo a partir del título. Solo tócalo si sabes lo que haces.
            </span>
            <input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                field("slug", e.target.value);
              }}
              className="max-w-md rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-mono outline-none focus:border-foreground"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Descripción para buscadores (opcional)
            </span>
            <span className="text-sm text-muted">
              Si lo dejas vacío, se usa el resumen corto de arriba.
            </span>
            <textarea
              value={values.metaDescription}
              onChange={(e) => field("metaDescription", e.target.value)}
              rows={2}
              className="resize-y max-w-xl rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
      </details>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-between border-t border-border pt-8">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("draft")}
            className="rounded-[var(--radius-sm)] border border-border px-5 py-3 text-sm font-medium text-foreground hover:border-foreground disabled:opacity-60"
          >
            Guardar como borrador
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("published")}
            className="rounded-[var(--radius-sm)] bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-60"
          >
            Publicar en la web
          </button>
        </div>

        {post && (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="text-sm text-danger hover:opacity-70 disabled:opacity-60"
          >
            Eliminar artículo
          </button>
        )}
      </div>
    </div>
  );
}
