import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const ROLE_LABELS: Record<string, string> = {
  manager:      'Manager',
  collaborateur: 'Collaborateur',
  directeur:    'Directeur',
}

export async function POST(req: NextRequest) {
  /* ── Auth : admin uniquement ── */
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if ((session as { role?: string }).role !== 'directeur') {
    return NextResponse.json({ error: 'Accès refusé — directeur requis' }, { status: 403 })
  }

  const agencyId = (session as { agency_id?: string }).agency_id
  if (!agencyId) {
    return NextResponse.json({ error: 'Agence non trouvée pour ce compte.' }, { status: 400 })
  }

  /* ── Payload ── */
  const body = await req.json() as { nom?: string; email?: string; role?: string }
  const { nom, email, role } = body

  if (!nom || !email || !role) {
    return NextResponse.json({ error: 'Champs manquants : nom, email, role' }, { status: 400 })
  }

  /* ── Vérifier email déjà existant ── */
  const { data: existing } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Un compte existe déjà avec cet email.' },
      { status: 409 }
    )
  }

  /* ── Vérifier invitation déjà envoyée ── */
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id, accepted')
    .eq('email', email)
    .eq('agency_id', agencyId)
    .eq('accepted', false)
    .maybeSingle()

  if (existingInvite) {
    return NextResponse.json(
      { error: 'Une invitation est déjà en attente pour cet email.' },
      { status: 409 }
    )
  }

  /* ── Générer token & insérer invitation ── */
  const token      = crypto.randomUUID()
  const invitedBy  = session.user.email

  const { error: dbError } = await supabase.from('invitations').insert([{
    email,
    nom,
    role,
    token,
    invited_by: invitedBy,
    agency_id:  agencyId,
  }])

  if (dbError) {
    return NextResponse.json(
      { error: `Erreur DB : ${dbError.message}` },
      { status: 500 }
    )
  }

  /* ── Récupérer nom entreprise pour l'email ── */
  const { data: adminProfile } = await supabase
    .from('users')
    .select('nom_entreprise, nom')
    .eq('email', invitedBy)
    .maybeSingle()

  const entreprise  = adminProfile?.nom_entreprise || 'Nexflow'
  const baseUrl     = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const activationLink = `${baseUrl}/activer-compte?token=${token}`
  const roleLabel   = ROLE_LABELS[role] ?? role

  /* ── Envoi email via Resend ── */
  const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation Nexflow</title>
</head>
<body style="margin:0;padding:0;background:#0a1a0f;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#0f2318;border:1px solid #1e4a2e;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid #1e4a2e;">
              <span style="font-weight:700;font-size:22px;color:#ffffff;">Nex</span>
              <span style="font-weight:700;font-size:22px;color:#22c55e;">flow</span>
              <div style="font-size:9px;color:#9CA3AF;letter-spacing:3px;margin-top:2px;">DIGITAL SOLUTIONS</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="color:#86efac;font-size:13px;margin:0 0 8px;">Bonjour <strong style="color:#f0fdf4;">${nom}</strong>,</p>
              <p style="color:#86efac;font-size:15px;margin:0 0 24px;line-height:1.6;">
                Vous avez été invité à rejoindre <strong style="color:#f0fdf4;">${entreprise}</strong>
                sur Nexflow.
              </p>

              <!-- Rôle badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#166534;border:1px solid #22c55e40;border-radius:8px;padding:10px 18px;">
                    <span style="color:#86efac;font-size:12px;letter-spacing:1px;">VOTRE RÔLE</span>
                    <br />
                    <span style="color:#22c55e;font-size:16px;font-weight:700;">${roleLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#22c55e;border-radius:12px;">
                    <a href="${activationLink}"
                      style="display:inline-block;padding:14px 32px;color:#0a1a0f;font-weight:700;
                             font-size:15px;text-decoration:none;border-radius:12px;">
                      Activer mon compte &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#4ade80;font-size:11px;margin:20px 0 0;line-height:1.5;">
                Ce lien est valable 7 jours. Si vous n'attendiez pas cet email, ignorez-le simplement.
              </p>
              <p style="color:#2d6a3f;font-size:11px;margin:8px 0 0;word-break:break-all;">
                ${activationLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 36px;border-top:1px solid #1e4a2e;">
              <p style="color:#15803d;font-size:11px;margin:0;letter-spacing:2px;">
                &copy; ${new Date().getFullYear()} NEXFLOW &middot; DIGITAL SOLUTIONS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  /* ── Vérifier que les variables Resend sont définies ── */
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('[INVITE] RESEND_API_KEY absent — email invitation non envoyé')
    return NextResponse.json(
      { warning: 'Invitation créée mais RESEND_API_KEY manquant — email non envoyé.' },
      { status: 207 }
    )
  }

  const resendFrom = process.env.RESEND_FROM_EMAIL
  if (!resendFrom) {
    console.error('[INVITE] RESEND_FROM_EMAIL absent — email invitation non envoyé')
    return NextResponse.json(
      { warning: 'Invitation créée mais RESEND_FROM_EMAIL manquant — email non envoyé.' },
      { status: 207 }
    )
  }

  console.log('[INVITE] Tentative envoi', {
    to:         email,
    from:       resendFrom,
    hasApiKey:  !!resendApiKey,
  })

  /* ── Appel Resend ── */
  let resendRes: Response
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from:    resendFrom,
        to:      [email],
        subject: `Invitation à rejoindre ${entreprise} sur Nexflow`,
        html:    emailHtml,
      }),
    })
  } catch (fetchErr) {
    console.error('[INVITE] Erreur réseau Resend :', fetchErr)
    return NextResponse.json(
      { warning: 'Invitation créée mais erreur réseau lors de l\'envoi email.' },
      { status: 207 }
    )
  }

  /* ── Lire la réponse Resend ── */
  const resendBody = await resendRes.text()
  console.log('[INVITE] Réponse Resend', { status: resendRes.status, body: resendBody })

  if (!resendRes.ok) {
    console.error(
      `[INVITE] Échec envoi email — HTTP ${resendRes.status} ${resendRes.statusText}\n` +
      `  to: ${email}\n  from: ${resendFrom}\n  body: ${resendBody}`
    )
    return NextResponse.json(
      {
        warning: 'Invitation créée mais échec de l\'envoi email.',
        detail:  resendBody,
        status:  resendRes.status,
      },
      { status: 207 }
    )
  }

  console.log(`[INVITE] Email envoyé à ${email} — réponse : ${resendBody}`)
  return NextResponse.json({ success: true })
}
