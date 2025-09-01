// lib/auth.ts - Configuration minimale pour éviter les erreurs d'import
import type { NextAuthOptions } from 'next-auth';
import { Role } from './permissions';

// Configuration minimale qui ne sera utilisée qu'en production
export const authOptions: NextAuthOptions = {
  providers: [
    // Tu ajouteras tes vrais providers plus tard
    // CredentialsProvider, GoogleProvider, etc.
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.role = (user as any).role as Role;
        token.username = (user as any).username ?? undefined;
        token.premiumUntil = (user as any).premiumUntil ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.role = token.role as Role;
      session.user.username = (token.username as string | undefined) ?? undefined;
      session.user.premiumUntil = (token.premiumUntil as Date | null) ?? null;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
};

// Helper vide pour getServerSession (utilisé seulement en production)
export async function getServerSession() {
  if (process.env.NODE_ENV === 'development') {
    // En développement, retourner null - le système de dev prend le relais
    return null;
  }
  
  // En production, utiliser NextAuth
  const { getServerSession: nextAuthGetServerSession } = await import('next-auth/next');
  return nextAuthGetServerSession(authOptions);
}