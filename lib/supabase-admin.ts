import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la service_role key.
 * ⚠️  À utiliser UNIQUEMENT côté serveur (API Routes, Server Actions).
 *     Ne jamais exposer cette clé au navigateur.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
