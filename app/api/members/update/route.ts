import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const ALLOWED_ROLES = ['collaborateur', 'manager', 'directeur'] as const
type Role = typeof ALLOWED_ROLES[number]

export async function PATCH(req: NextRequest) {
  /* ── Auth : directeur uniquement ── */
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if ((session as { role?: string }).role !== 'directeur') {
    return NextResponse.json({ error: 'Accès refusé — directeur requis' }, { status: 403 })
  }

  /* ── Payload ── */
  const { email, role } = await req.json() as { email?: string; role?: string }
  if (!email || !role) {
    return NextResponse.json({ error: 'Champs manquants : email, role' }, { status: 400 })
  }
  if (!ALLOWED_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: `Rôle invalide. Valeurs acceptées : ${ALLOWED_ROLES.join(', ')}` }, { status: 400 })
  }

  /* ── Empêcher l'auto-modification vers un rôle inférieur ── */
  if (email === session.user.email && role !== 'directeur') {
    return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre rôle de directeur.' }, { status: 400 })
  }

  /* ── Mise à jour ── */
  const { error } = await supabase.from('users').update({ role }).eq('email', email)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
