import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  /* ── Auth : admin uniquement ── */
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if ((session as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé — administrateur requis' }, { status: 403 })
  }

  /* ── Payload ── */
  const { email } = await req.json() as { email?: string }
  if (!email) {
    return NextResponse.json({ error: 'Email manquant' }, { status: 400 })
  }

  /* ── Empêcher l'auto-suppression ── */
  if (email === session.user.email) {
    return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 })
  }

  /* ── Suppression ── */
  const { error } = await supabase.from('users').delete().eq('email', email)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
