import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { storeAndSendVerificationEmail } from '@/lib/email-verification'

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string }
  const { email } = body

  if (!email) {
    return NextResponse.json({ error: 'Email manquant.' }, { status: 400 })
  }

  /* Vérifier que l'utilisateur existe et n'est pas déjà vérifié */
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('nom, email_verified')
    .eq('email', email)
    .maybeSingle()

  if (!user) {
    /* Réponse neutre pour ne pas confirmer l'existence du compte */
    return NextResponse.json({ success: true })
  }

  if (user.email_verified) {
    return NextResponse.json({ error: 'Cet email est déjà vérifié.' }, { status: 409 })
  }

  const { error } = await storeAndSendVerificationEmail(email, user.nom ?? email)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
