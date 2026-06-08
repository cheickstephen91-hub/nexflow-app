-- ────────────────────────────────────────────────────────────
--  Migration : Rôles & Invitations
--  Exécuter dans l'éditeur SQL de Supabase
-- ────────────────────────────────────────────────────────────

-- 1. Colonne rôle dans users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'negociateur';

-- 2. Table invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  nom         text NOT NULL,
  role        text NOT NULL,
  token       text NOT NULL UNIQUE,
  invited_by  text NOT NULL,
  accepted    boolean DEFAULT false,
  created_at  timestamp with time zone DEFAULT now(),
  expires_at  timestamp with time zone DEFAULT now() + interval '7 days'
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read"   ON public.invitations FOR SELECT USING (true);
CREATE POLICY "insert" ON public.invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "update" ON public.invitations FOR UPDATE USING (true);
