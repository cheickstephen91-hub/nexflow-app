-- ============================================================
--  Backfill Multi-Agence
--  Étape 2 : Rattachement des données existantes
--  Exécuter APRÈS migration_multiagence.sql
--  Garanties :
--    - Aucune donnée supprimée
--    - Les users/fiches non rattachables conservent agency_id = NULL
--    - Les rôles négociateur ne sont pas modifiés
-- ============================================================

-- ── 1. Créer une agence par directeur existant ───────────────
--      Source : users.nom_entreprise (jamais NULL chez les directeurs)

INSERT INTO public.agencies (nom, nom_entreprise, secteur, pays, logo_url, email_contact, telephone, site_web, adresse)
SELECT
  COALESCE(NULLIF(TRIM(u.nom_entreprise), ''), u.email) AS nom,
  NULLIF(TRIM(u.nom_entreprise), '')                    AS nom_entreprise,
  u.secteur,
  u.pays,
  u.logo_url,
  u.email_contact,
  u.telephone,
  u.site_web,
  NULL                                                  AS adresse
FROM public.users u
WHERE u.role = 'directeur'
  AND u.agency_id IS NULL
ON CONFLICT DO NOTHING;

-- ── 2. Rattacher les directeurs à leur agence ────────────────
--      Correspondance : nom_entreprise du directeur = nom de l'agence créée

UPDATE public.users u
SET agency_id = a.id
FROM public.agencies a
WHERE u.role = 'directeur'
  AND u.agency_id IS NULL
  AND (
    (NULLIF(TRIM(u.nom_entreprise), '') IS NOT NULL AND a.nom = COALESCE(NULLIF(TRIM(u.nom_entreprise), ''), u.email))
    OR (NULLIF(TRIM(u.nom_entreprise), '') IS NULL  AND a.nom = u.email)
  );

-- ── 3. Rattacher les collaborateurs invités ──────────────────
--      Via la table invitations : invited_by → directeur → agency_id

UPDATE public.users u
SET agency_id = director.agency_id
FROM public.invitations inv
JOIN public.users director ON director.email = inv.invited_by
WHERE u.email    = inv.email
  AND u.agency_id IS NULL
  AND director.agency_id IS NOT NULL;

-- ── 4. Rattacher les invitations ─────────────────────────────

UPDATE public.invitations inv
SET agency_id = director.agency_id
FROM public.users director
WHERE inv.invited_by      = director.email
  AND director.agency_id IS NOT NULL
  AND inv.agency_id IS NULL;

-- ── 5. Rattacher les fiches (via user_email) ─────────────────
--      Les fiches avec user_email = NULL restent agency_id = NULL

UPDATE public.fiches f
SET agency_id = u.agency_id
FROM public.users u
WHERE f.user_email       = u.email
  AND u.agency_id IS NOT NULL
  AND f.agency_id IS NULL;

-- ============================================================
--  RAPPORT POST-MIGRATION
-- ============================================================

-- Agences créées
SELECT
  'agencies' AS table_name,
  COUNT(*)   AS total_créées
FROM public.agencies;

-- Users rattachés / non rattachés
SELECT
  role,
  COUNT(*) FILTER (WHERE agency_id IS NOT NULL) AS rattachés,
  COUNT(*) FILTER (WHERE agency_id IS NULL)     AS non_rattachés,
  COUNT(*)                                       AS total
FROM public.users
GROUP BY role
ORDER BY role;

-- Fiches rattachées / orphelines
SELECT
  COUNT(*) FILTER (WHERE agency_id IS NOT NULL) AS fiches_rattachées,
  COUNT(*) FILTER (WHERE agency_id IS NULL
                     AND user_email IS NOT NULL) AS fiches_user_sans_agence,
  COUNT(*) FILTER (WHERE agency_id IS NULL
                     AND user_email IS NULL)     AS fiches_orphelines_sans_email,
  COUNT(*)                                       AS total_fiches
FROM public.fiches;

-- Détail agences
SELECT
  a.id,
  a.nom,
  a.nom_entreprise,
  COUNT(DISTINCT u.email) AS membres,
  COUNT(DISTINCT f.id)    AS fiches,
  COUNT(DISTINCT i.id)    AS invitations
FROM public.agencies a
LEFT JOIN public.users       u ON u.agency_id = a.id
LEFT JOIN public.fiches      f ON f.agency_id = a.id
LEFT JOIN public.invitations i ON i.agency_id = a.id
GROUP BY a.id, a.nom, a.nom_entreprise
ORDER BY membres DESC;
