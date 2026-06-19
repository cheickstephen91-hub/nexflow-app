-- ============================================================
--  Migration : Architecture Multi-Agence
--  Étape 1 : DDL — table agencies + colonnes agency_id
--  Exécuter dans l'éditeur SQL Supabase
--  Non destructif — aucune donnée supprimée
-- ============================================================

-- ── 1. Table agencies ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agencies (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz DEFAULT now(),
  nom              text        NOT NULL,
  nom_entreprise   text,
  secteur          text        DEFAULT 'immobilier',
  pays             text,
  logo_url         text,
  email_contact    text,
  telephone        text,
  site_web         text,
  adresse          text,
  -- Colonnes abonnement futur
  plan             text        DEFAULT 'gratuit',
  status           text        DEFAULT 'actif',
  max_users        integer     DEFAULT 10,
  max_properties   integer     DEFAULT 500
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies_select" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "agencies_insert" ON public.agencies FOR INSERT WITH CHECK (true);
CREATE POLICY "agencies_update" ON public.agencies FOR UPDATE USING (true);

-- ── 2. Colonnes agency_id dans les tables existantes ─────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

ALTER TABLE public.fiches
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- NOTE : table agents non modifiée dans cette phase

-- ── 3. Index de performance ───────────────────────────────────

CREATE INDEX IF NOT EXISTS users_agency_id_idx
  ON public.users(agency_id);

CREATE INDEX IF NOT EXISTS invitations_agency_id_idx
  ON public.invitations(agency_id);

CREATE INDEX IF NOT EXISTS fiches_agency_id_idx
  ON public.fiches(agency_id);
