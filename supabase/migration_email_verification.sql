-- ============================================================
--  Migration : Vérification d'email
--  Ajouter les colonnes de vérification sur la table users
--  Exécuter dans l'éditeur SQL Supabase
--  Non destructif — aucune donnée supprimée
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified                 boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at              timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_token             text        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at  timestamptz DEFAULT NULL;

-- Index pour la lookup par token (appelé à chaque clic sur le lien)
CREATE INDEX IF NOT EXISTS users_verification_token_idx
  ON public.users(verification_token)
  WHERE verification_token IS NOT NULL;

-- ── Backfill : marquer les comptes existants comme vérifiés ──
-- Les utilisateurs créés avant cette migration n'ont pas à reverifier.
-- On les considère vérifiés si leur compte est actif (password_hash présent
-- ou compte Google — password_hash NULL).
UPDATE public.users
SET
  email_verified    = true,
  email_verified_at = now()
WHERE email_verified = false;

-- ── Rapport post-migration ────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE email_verified = true)  AS verified,
  COUNT(*) FILTER (WHERE email_verified = false) AS unverified,
  COUNT(*)                                        AS total
FROM public.users;
