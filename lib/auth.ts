import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        nom:      { label: 'Nom',          type: 'text' },
        mode:     { label: 'Mode',         type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { email, password, nom, mode } = credentials

        /* ── Inscription ── */
        if (mode === 'signup') {
          const { data: existing } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle()

          if (existing) throw new Error('Un compte existe déjà avec cet email.')

          const hash = await bcrypt.hash(password, 10)
          const { error } = await supabase.from('users').insert([{
            email,
            nom: nom || email,
            password_hash: hash,
            onboarding_complete: false,
          }])

          if (error) throw new Error('Erreur lors de la création du compte.')

          return { id: email, email, name: nom || email }
        }

        /* ── Connexion ── */
        const { data: user, error: dbError } = await supabase
          .from('users')
          .select('id, email, nom, password_hash, role')
          .eq('email', email)
          .maybeSingle()

        if (dbError) {
          if (dbError.message?.includes('password_hash')) {
            throw new Error(
              'Configuration incomplète : exécutez "supabase/migration_add_password.sql" dans Supabase.'
            )
          }
          throw new Error('Erreur de connexion à la base de données.')
        }

        if (!user) throw new Error('Aucun compte trouvé avec cet email.')

        if (user.password_hash === null || user.password_hash === undefined) {
          throw new Error(
            'Ce compte est associé à Google. Utilisez le bouton "Continuer avec Google".'
          )
        }

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) throw new Error('Mot de passe incorrect.')

        return { id: user.id ?? email, email: user.email, name: user.nom }
      },
    }),
  ],

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token  = account.access_token
        token.refresh_token = account.refresh_token
        token.expires_at    = account.expires_at
      }

      /* Relire le rôle depuis Supabase à chaque appel du callback */
      const email = token.email
      if (email) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .maybeSingle()
        token.role = data?.role ?? 'negociateur'
      }

      return token
    },

    async session({ session, token }) {
      session.access_token = token.access_token as string | undefined
      session.role         = token.role         as string | undefined
      return session
    },
  },

  pages: {
    signIn: '/login',
  },
}
