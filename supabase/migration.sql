-- Table des fiches de qualification d'appels
create table if not exists public.fiches (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamp with time zone default now(),
  nom_prospect text,
  telephone    text,
  source       text,
  motif        text,
  type_bien    text,
  budget       text,
  localisation text,
  urgence      text,
  transmettre_a text,
  commentaire  text,
  agent        text
);

-- Activer Row Level Security
alter table public.fiches enable row level security;

-- Politique : lecture et écriture autorisées pour les utilisateurs authentifiés
create policy "Authenticated users can read fiches"
  on public.fiches for select
  using (true);

create policy "Authenticated users can insert fiches"
  on public.fiches for insert
  with check (true);

create policy "Authenticated users can update fiches"
  on public.fiches for update
  using (true);
