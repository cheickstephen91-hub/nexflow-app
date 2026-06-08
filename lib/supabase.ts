import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Fiche = {
  id?: string
  created_at?: string
  user_email?: string
  nom_prospect: string
  telephone: string
  source: string
  motif: string
  type_bien: string
  budget: string
  localisation: string
  urgence: string
  transmettre_a: string
  commentaire: string
  agent: string
}
