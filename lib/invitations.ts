import { supabase } from './supabase'

export type Invitation = {
  id?: string
  email: string
  nom: string
  role: string
  token: string
  invited_by: string
  accepted?: boolean
  created_at?: string
  expires_at?: string
  agency_id?: string
}

/* ── Récupérer les invitations d'une agence (pour la page équipe) ── */
export async function getInvitations(agencyId?: string): Promise<Invitation[]> {
  let query = supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (agencyId) {
    query = query.eq('agency_id', agencyId)
  }

  const { data } = await query
  return data ?? []
}

/* ── Récupérer une invitation par token ── */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  return data ?? null
}

/* ── Marquer une invitation comme acceptée ── */
export async function acceptInvitation(token: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('invitations')
    .update({ accepted: true })
    .eq('token', token)
  return { error: error?.message ?? null }
}
