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
  if ((session as { role?: string }).role !== 'directeur') {
    return NextResponse.json({ error: 'Accès refusé — directeur requis' }, { status: 403 })
  }

  /* ── Payload ── */
  const { id } = await req.json() as { id?: string }
  if (!id) {
    return NextResponse.json({ error: 'ID invitation manquant' }, { status: 400 })
  }

  /* ── Suppression ── */
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
