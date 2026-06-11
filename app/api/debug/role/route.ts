import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié', session: null }, { status: 401 })
  }

  const email    = session.user.email
  const roleJwt  = (session as { role?: string }).role ?? null

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role, email, nom')
    .eq('email', email)
    .maybeSingle()

  const roleSupabase = data?.role ?? null
  const match        = roleJwt === roleSupabase

  return NextResponse.json({
    email,
    role_jwt:      roleJwt,
    role_supabase: roleSupabase,
    match,
    supabase_error: error?.message ?? null,
    supabase_user:  data ?? null,
  })
}
