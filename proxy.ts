import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const role     = token?.role as string | null | undefined
    const pathname = req.nextUrl.pathname

    // Si pas de token → withAuth redirige vers /login (géré par authorized ci-dessous)
    if (!token) return NextResponse.next()

    /* ── Équipe & Paramètres → admin uniquement ── */
    if (pathname.startsWith('/equipe') || pathname.startsWith('/parametres')) {
      if (role && role !== 'admin') {
        const url = req.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('access', 'denied')
        return NextResponse.redirect(url)
      }
    }

    /* ── Tableau de bord → admin + superviseur ── */
    if (pathname.startsWith('/tableau-de-bord')) {
      // Laisse passer si rôle null/undefined (pas encore chargé depuis Supabase)
      if (role && role !== 'admin' && role !== 'superviseur') {
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
