-- Ajouter la colonne user_email à la table fiches pour isoler les données par compte
alter table public.fiches add column if not exists user_email text;

-- Index pour accélérer les requêtes filtrées par utilisateur
create index if not exists fiches_user_email_idx on public.fiches (user_email);
