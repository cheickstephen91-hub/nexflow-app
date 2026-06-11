import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const role     = token?.role as string | undefined
    const pathname = req.nextUrl.pathname

    /* ── Équipe & Paramètres → admin uniquement ── */
    if (
      (pathname.startsWith('/equipe') || pathname.startsWith('/parametres')) &&
      role !== 'admin'
    ) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('access', 'denied')
      return NextResponse.redirect(url)
    }

    /* ── Tableau de bord → admin + superviseur ── */
    if (pathname.startsWith('/tableau-de-bord')) {
      // Tolérance : rôle non chargé OU token fraîchement émis (< 30s)
      const tokenAge = token?.iat ? Math.floor(Date.now() / 1000) - (token.iat as number) : 0
      const tokenFresh = tokenAge < 30
      const roleKnown = role !== undefined && role !== null

      if (roleKnown && !tokenFresh && role !== 'admin' && role !== 'superviseur') {
        const url = req.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('access', 'denied')
        return NextResponse.redirect(url)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Protège toutes les routes sauf :
     * - /login              (page de connexion publique)
     * - /activer-compte     (activation par lien d'invitation)
     * - /api/auth/**        (callbacks NextAuth)
     * - fichiers statiques  (_next, favicon, images, SVG…)
     */
    '/((?!login|activer-compte|api/auth|api/chatbot|_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)',
  ],
}
