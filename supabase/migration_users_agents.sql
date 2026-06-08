-- ── Table users (profils) ──────────────────────────────────────────
create table if not exists public.users (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamp with time zone default now(),
  email               text unique not null,
  nom                 text,
  pays                text,
  type_compte         text,
  nom_entreprise      text,
  secteur             text,
  nombre_employes     text,
  logo_url            text,
  telephone           text,
  email_contact       text,
  rapport_frequence   text default 'Désactivé',
  rapport_email       text,
  onboarding_complete boolean default false
);

alter table public.users enable row level security;

create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (true);
create policy "users_update" on public.users for update using (true);

-- ── Table agents ────────────────────────────────────────────────────
create table if not exists public.agents (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamp with time zone default now(),
  user_email  text not null,
  nom         text not null,
  role        text
);

alter table public.agents enable row level security;

create policy "agents_select" on public.agents for select using (true);
create policy "agents_insert" on public.agents for insert with check (true);
create policy "agents_update" on public.agents for update using (true);
create policy "agents_delete" on public.agents for delete using (true);

-- ── Storage bucket logos ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_select" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_insert" on storage.objects
  for insert with check (bucket_id = 'logos');

create policy "logos_update" on storage.objects
  for update using (bucket_id = 'logos');

create policy "logos_delete" on storage.objects
  for delete using (bucket_id = 'logos');
