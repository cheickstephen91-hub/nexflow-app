import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié', session: null }, { status: 401 })
  }

  const email     = session.user.email
  const roleJwt   = (session as { role?: string;  agency_id?: string }).role      ?? null
  const agencyJwt = (session as { role?: string;  agency_id?: string }).agency_id ?? null

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role, email, nom, agency_id')
    .eq('email', email)
    .maybeSingle()

  const roleSupabase   = data?.role      ?? null
  const agencySupabase = data?.agency_id ?? null
  const roleMatch      = roleJwt   === roleSupabase
  const agencyMatch    = agencyJwt === agencySupabase

  return NextResponse.json({
    email,
    role_jwt:        roleJwt,
    role_supabase:   roleSupabase,
    role_match:      roleMatch,
    agency_id_jwt:   agencyJwt,
    agency_id_db:    agencySupabase,
    agency_match:    agencyMatch,
    supabase_error:  error?.message ?? null,
    supabase_user:   data ?? null,
  })
}
