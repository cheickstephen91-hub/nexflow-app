-- DEV ONLY — Utilisateur de prévisualisation Nexflow
--
-- Pourquoi ce seed est nécessaire :
--   Le callback jwt de lib/auth.ts requête Supabase sur chaque requête pour
--   résoudre le rôle depuis la table users. Sans cette ligne, preview@nexflow.dev
--   n'existe pas dans la base → token.role = null → la page Équipe n'affiche
--   pas les contrôles directeur (bien qu'elle ne redirige pas non plus).
--
-- Comment l'exécuter :
--   Supabase Dashboard → SQL Editor → coller ce fichier → Run
--   OU : supabase db reset (si migrations locales configurées)
--
-- Ce seed est idempotent (ON CONFLICT DO NOTHING).

INSERT INTO public.users (email, nom, role, onboarding_complete)
VALUES ('preview@nexflow.dev', 'Dev Preview — Directeur', 'directeur', true)
ON CONFLICT (email) DO NOTHING;
