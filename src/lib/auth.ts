// lib/auth.ts - Configuration minimale pour éviter les erreurs d'import
import type { NextAuthOptions } from 'next-auth';

// Configuration minimale qui ne sera utilisée qu'en production
export const authOptions: NextAuthOptions = {
  providers: [
    // Tu ajouteras tes vrais providers plus tard
    // CredentialsProvider, GoogleProvider, etc.
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
      }
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