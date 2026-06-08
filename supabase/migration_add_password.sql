-- Migration : ajout du champ password_hash pour l'authentification email/mot de passe
-- À exécuter dans l'éditeur SQL de Supabase

alter table public.users
  add column if not exists password_hash text;
