import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase-admin'

const TOKEN_EXPIRY_HOURS = 24

/* ── Échappement HTML (protection contre l'injection dans le template email) ── */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
}

/* ── Génération d'un token sûr (32 octets = 64 hex chars) ── */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

/* ── Stocker le token en base et envoyer l'email de vérification ── */
export async function storeAndSendVerificationEmail(
  email: string,
  nom:   string,
): Promise<{ error: string | null; emailSent: boolean }> {
  const token   = generateVerificationToken()
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  /* Stocker le token */
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({
      verification_token:            token,
      verification_token_expires_at: expires.toISOString(),
    })
    .eq('email', email)

  if (dbError) return { error: dbError.message, emailSent: false }

  /* Construire le lien */
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link    = `${baseUrl}/verifier-email?token=${token}`

  /* Envoyer via Resend */
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('[EMAIL VERIFY] RESEND_API_KEY absent — email de vérification non envoyé')
    return { error: null, emailSent: false }
  }

  const resendFrom = process.env.RESEND_FROM_EMAIL
  if (!resendFrom) {
    console.warn('[EMAIL VERIFY] RESEND_FROM_EMAIL absent — email de vérification non envoyé')
    return { error: null, emailSent: false }
  }

  console.log('[EMAIL VERIFY] Tentative envoi', {
    email,
    from:      resendFrom,
    hasApiKey: !!resendApiKey,
  })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from:    resendFrom,
        to:      [email],
        subject: 'Vérifiez votre adresse email — Nexflow',
        html:    buildVerificationEmailHtml(nom, link),
      }),
    })

    const result = await res.text()
    console.log('[EMAIL VERIFY] Réponse Resend', { status: res.status, body: result })

    if (!res.ok) {
      console.error(`[EMAIL VERIFY] Échec envoi vérification — HTTP ${res.status}: ${result}`)
      return { error: null, emailSent: false }
    }
  } catch (err) {
    console.error('[EMAIL VERIFY] Erreur réseau Resend :', err)
    return { error: null, emailSent: false }
  }

  return { error: null, emailSent: true }
}

/* ── Valider un token et activer l'email ── */
export async function verifyEmailToken(token: string): Promise<{
  success:  boolean
  email?:   string
  error?:   'invalid' | 'expired' | 'already_verified'
}> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('email, email_verified, verification_token_expires_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (error || !data) return { success: false, error: 'invalid' }

  if (data.email_verified) {
    return { success: false, error: 'already_verified', email: data.email }
  }

  if (
    data.verification_token_expires_at &&
    new Date(data.verification_token_expires_at) < new Date()
  ) {
    /* Nettoyer le token expiré — hygiène, même s'il est inutilisable */
    await supabaseAdmin
      .from('users')
      .update({
        verification_token:            null,
        verification_token_expires_at: null,
      })
      .eq('email', data.email)
    return { success: false, error: 'expired', email: data.email }
  }

  /* Activer + invalider le token (usage unique) */
  await supabaseAdmin
    .from('users')
    .update({
      email_verified:                true,
      email_verified_at:             new Date().toISOString(),
      verification_token:            null,
      verification_token_expires_at: null,
    })
    .eq('email', data.email)

  return { success: true, email: data.email }
}

/* ── Template email de vérification ── */
function buildVerificationEmailHtml(nom: string, link: string): string {
  const safeName = escapeHtml(nom)
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vérifiez votre email — Nexflow</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 24px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%);">
              <span style="font-weight:800;font-size:22px;color:#1e293b;">Nex</span>
              <span style="font-weight:800;font-size:22px;color:#2563eb;">flow</span>
              <div style="font-size:9px;color:#94a3b8;letter-spacing:3px;margin-top:2px;text-transform:uppercase;">Digital Solutions</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">

              <!-- Icône -->
              <div style="width:56px;height:56px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
                <span style="font-size:28px;">✉️</span>
              </div>

              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Confirmez votre adresse email</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                Bonjour <strong style="color:#0f172a;">${safeName}</strong>,<br/>
                Cliquez sur le bouton ci-dessous pour activer votre compte Nexflow.<br/>
                Ce lien est valable <strong>24 heures</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#3b82f6,#2563eb);">
                    <a href="${link}"
                      style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;
                             font-size:15px;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      Vérifier mon adresse email →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;line-height:1.5;">
                Si vous n'avez pas créé de compte Nexflow, ignorez cet email.
              </p>
              <p style="font-size:11px;color:#cbd5e1;margin:0;word-break:break-all;">
                ${link}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 36px;border-top:1px solid #f1f5f9;background:#f8fafc;">
              <p style="margin:0;font-size:11px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">
                &copy; ${new Date().getFullYear()} Nexflow &middot; Digital Solutions
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
}
