/**
 * DEV PREVIEW ROUTE — Nexflow
 *
 * Pourquoi cette route existe :
 *   Les pages protégées de Nexflow nécessitent une session NextAuth valide.
 *   En développement, passer par le flux OAuth/credentials à chaque rechargement
 *   ralentit la validation visuelle des composants. Cette route crée une session
 *   fictive directement via le mécanisme natif NextAuth (encode JWT), sans toucher
 *   au middleware ni aux règles d'authentification de production.
 *
 * Contraintes de sécurité :
 *   - Bloquée en production (NODE_ENV !== 'development' → 404)
 *   - Utilisateur fictif clairement identifiable (preview@nexflow.dev)
 *   - Aucune donnée de production codée en dur
 *   - Expiration courte : 1 heure
 *
 * Placée sous /api/chatbot/ car ce préfixe est exclu du middleware withAuth (proxy.ts).
 * La route /api/dev/session était interceptée par le middleware avant de s'exécuter.
 *
 * Prérequis Supabase (optionnel — pour session.role === 'directeur') :
 *   Le callback jwt de lib/auth.ts lit le rôle depuis la table users.
 *   → Exécuter supabase/seed-dev-preview.sql dans le dashboard Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'
import { encode }                     from 'next-auth/jwt'

const DEV_USER = {
  sub:   'dev-preview-nexflow',
  email: 'preview@nexflow.dev',
  name:  'Dev Preview — Directeur',
}

const MAX_AGE_SECONDS = 3600 // 1 heure

export async function GET(req: NextRequest) {
  // Guard : réservé au développement uniquement
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 })
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'NEXTAUTH_SECRET manquant — vérifier .env.local' },
      { status: 500 },
    )
  }

  // Log serveur : IP + timestamp pour traçabilité
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'localhost'
  const timestamp = new Date().toISOString()
  console.log(`[DEV PREVIEW] Session créée — IP: ${ip} — ${timestamp}`)

  const now = Math.floor(Date.now() / 1000)
  // NB : ne pas passer de `salt` — next-auth/middleware utilise salt="" (défaut) pour getDerivedEncryptionKey.
  // Passer le nom du cookie comme salt changerait la clé HKDF et provoquerait JWEDecryptionFailed.
  const cookieName = 'next-auth.session-token'
  const token = await encode({
    token: {
      ...DEV_USER,
      iat: now,
      exp: now + MAX_AGE_SECONDS,
      jti: `dev-preview-${now}`,
    },
    secret,
    maxAge: MAX_AGE_SECONDS,
  })

  const to       = req.nextUrl.searchParams.get('to') ?? '/tableau-de-bord'
  const response = NextResponse.redirect(new URL(to, req.url))

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   MAX_AGE_SECONDS,
    // secure: false en développement (HTTP localhost)
  })

  return response
}
