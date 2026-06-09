import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const role     = (token?.role as string | undefined) ?? 'negociateur'
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
    if (
      pathname.startsWith('/tableau-de-bord') &&
      role !== 'admin' &&
      role !== 'superviseur'
    ) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('access', 'denied')
      return NextResponse.redirect(url)
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
