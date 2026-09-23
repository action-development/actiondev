-- Tabla `posts` — blog de Action, gestionado desde apps/admin, leído
-- públicamente (solo status='published') desde apps/desktop.
-- Ejecutar en el SQL editor de Supabase (o vía `supabase db push`).

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  meta_description text not null,
  category text not null,
  date date not null,
  reading_time integer not null,
  h1 text not null,
  excerpt text not null,
  content jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_idx on posts (status);

create or replace function set_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at
  before update on posts
  for each row
  execute function set_posts_updated_at();

alter table posts enable row level security;

-- Lectura pública: solo posts publicados. La usa apps/desktop con la anon key.
create policy "posts_public_read_published"
  on posts for select
  to anon
  using (status = 'published');

-- Lectura/escritura completa: solo el usuario admin (allowlist por email en
-- la propia policy, no solo en código — un único editor, sin tabla de roles).
create policy "posts_admin_read_all"
  on posts for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'desarrollo1@actiondev.es');

create policy "posts_admin_write"
  on posts for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'desarrollo1@actiondev.es');

create policy "posts_admin_update"
  on posts for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'desarrollo1@actiondev.es')
  with check (auth.jwt() ->> 'email' = 'desarrollo1@actiondev.es');

create policy "posts_admin_delete"
  on posts for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'desarrollo1@actiondev.es');
