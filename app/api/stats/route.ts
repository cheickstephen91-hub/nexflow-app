import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  /* ── Auth : seul un utilisateur connecté peut récupérer les stats ── */
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const [todayRes, totalRes] = await Promise.all([
      supabaseAdmin
        .from('fiches')
        .select('id', { count: 'exact' })
        .gte('created_at', todayISO),
      supabaseAdmin
        .from('fiches')
        .select('id', { count: 'exact' }),
    ])

    if (todayRes.error) {
      console.error('[stats/today] Supabase error:', todayRes.error)
    }
    if (totalRes.error) {
      console.error('[stats/total] Supabase error:', totalRes.error)
    }

    const today_count = typeof todayRes.count === 'number'
      ? todayRes.count
      : (todayRes.data?.length ?? 0)

    const total_count = typeof totalRes.count === 'number'
      ? totalRes.count
      : (totalRes.data?.length ?? 0)

    return NextResponse.json({ today_count, total_count })
  } catch (err) {
    console.error('[stats] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
