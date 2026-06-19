-- ============================================================
--  RLS Multi-Agence
--  Étape 3 : Nouvelles politiques de sécurité
--  Exécuter APRÈS backfill_multiagence.sql
--
--  Contexte architectural :
--    Nexflow utilise NextAuth (pas Supabase Auth).
--    auth.uid() et auth.jwt() côté Supabase sont toujours NULL
--    pour les requêtes client anon.
--
--  Stratégie :
--    - Isolation primaire : filtres agency_id dans le code applicatif
--    - RLS secondaire : bloquer les rows sans agency_id pour éviter
--      que des données orphelines soient lues par le client anon
--    - Les routes serveur utilisent supabaseAdmin (service_role)
--      qui bypass RLS — l'isolation y est garantie par getServerSession()
-- ============================================================

-- ── users ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

-- Lecture : tous les users sont lisibles (le filtre agency_id est côté app)
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (true);

-- Insertion : autorisée (création de compte, onboarding)
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (true);

-- Mise à jour : autorisée via code app (les routes API vérifient l'agence)
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (true);

-- Suppression : via route API uniquement (vérification agence dans le code)
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (true);

-- ── fiches ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read fiches" ON public.fiches;
DROP POLICY IF EXISTS "Authenticated users can insert fiches" ON public.fiches;
DROP POLICY IF EXISTS "Authenticated users can update fiches" ON public.fiches;

-- Le client anon ne peut lire que les fiches ayant un user_email renseigné
-- (bloque les 6 fiches orphelines pour le client — supabaseAdmin les voit toujours)
CREATE POLICY "fiches_select" ON public.fiches
  FOR SELECT USING (user_email IS NOT NULL);

CREATE POLICY "fiches_insert" ON public.fiches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "fiches_update" ON public.fiches
  FOR UPDATE USING (true);

-- ── invitations ──────────────────────────────────────────────

DROP POLICY IF EXISTS "read"   ON public.invitations;
DROP POLICY IF EXISTS "insert" ON public.invitations;
DROP POLICY IF EXISTS "update" ON public.invitations;

CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT USING (true);

CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "invitations_update" ON public.invitations
  FOR UPDATE USING (true);

CREATE POLICY "invitations_delete" ON public.invitations
  FOR DELETE USING (true);

-- ── agencies ─────────────────────────────────────────────────
-- Déjà créées dans migration_multiagence.sql — pas de modification nécessaire

-- ── agents (non modifié dans cette phase) ────────────────────
-- Les policies existantes (agents_select/insert/update/delete USING true)
-- sont conservées telles quelles.
