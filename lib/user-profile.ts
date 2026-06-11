import { supabase } from './supabase'

/* ── Types ── */

export type UserProfile = {
  id?: string
  created_at?: string
  email: string
  nom?: string
  prenom?: string
  pays?: string
  type_compte?: string
  nom_entreprise?: string
  secteur?: string
  nombre_employes?: string
  logo_url?: string
  telephone?: string
  email_contact?: string
  site_web?: string
  adresse?: string
  rccm?: string
  contribuable?: string
  services?: string
  zones?: string
  nombre_biens?: string
  rapport_frequence?: string
  rapport_email?: string
  onboarding_complete?: boolean
  role?: string
}

export type Agent = {
  id?: string
  created_at?: string
  user_email: string
  nom: string
  role?: string
}

/* ── User profile ── */

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  return data ?? null
}

export async function upsertUserProfile(profile: UserProfile): Promise<{ error: string | null }> {
  let finalRole = profile.role

  /* Premier utilisateur = admin : déclenché quand onboarding_complete passe à true */
  if (profile.onboarding_complete && !finalRole) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('onboarding_complete', true)

    finalRole = (count === 0) ? 'directeur' : 'collaborateur'
  }

  const toUpsert = { ...profile, ...(finalRole ? { role: finalRole } : {}) }

  const { error } = await supabase
    .from('users')
    .upsert([toUpsert], { onConflict: 'email' })

  return { error: error?.message ?? null }
}

/* ── Agents ── */

export async function getAgents(userEmail: string): Promise<Agent[]> {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addAgent(agent: Omit<Agent, 'id' | 'created_at'>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('agents').insert([agent])
  return { error: error?.message ?? null }
}

export async function deleteAgent(id: string): Promise<void> {
  await supabase.from('agents').delete().eq('id', id)
}

/* ── Logo upload ── */

export async function uploadLogo(file: File, userEmail: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_')
  const path = `${safeEmail}/logo.${ext}`

  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return null

  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}

/* ── Utility : fetch distant URL → data-URL base64 ── */

export async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
