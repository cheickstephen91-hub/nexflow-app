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
}

/* ── Récupérer toutes les invitations (pour la page équipe) ── */
export async function getInvitations(): Promise<Invitation[]> {
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })
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
