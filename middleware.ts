export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!api/chatbot|api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ],
}
