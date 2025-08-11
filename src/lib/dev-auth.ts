// lib/dev-auth.ts - Système d'auth pour le développement
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface commune pour tous les utilisateurs
interface DevUserData {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'PREMIUM' | 'MODERATOR';
}

// Utilisateurs de test avec interface commune
export const DEV_USERS: Record<string, DevUserData> = {
  admin: {
    id: 'dev-admin-id',
    username: 'admin',
    email: 'admin@conlang.local',
    role: 'ADMIN',
  },
  user: {
    id: 'dev-user-id', 
    username: 'alice',
    email: 'alice@conlang.local',
    role: 'USER',
  },
  premium: {
    id: 'dev-premium-id',
    username: 'bob',
    email: 'bob@conlang.local', 
    role: 'PREMIUM',
  },
  moderator: {
    id: 'dev-moderator-id',
    username: 'charlie',
    email: 'charlie@conlang.local',
    role: 'MODERATOR',
  },
};

export type DevUserKey = keyof typeof DEV_USERS;
export type DevUser = DevUserData;

// Récupérer l'utilisateur actif pour le développement
export function getDevUser(): DevUser {
  // Côté serveur ou si localStorage n'est pas disponible : utilisateur par défaut
  if (typeof window === 'undefined') {
    return DEV_USERS.premium; // Par défaut premium pour tester les features IA
  }
  
  try {
    // Côté client : récupérer depuis localStorage
    const savedUser = localStorage.getItem('dev-user');
    if (savedUser && savedUser in DEV_USERS) {
      return DEV_USERS[savedUser];
    }
  } catch (error) {
    // Fallback si localStorage n'est pas accessible
    console.warn('Cannot access localStorage:', error);
  }
  
  return DEV_USERS.premium; // Par défaut
}

// Changer d'utilisateur de développement
export function setDevUser(userKey: DevUserKey) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dev-user', userKey);
    // Recharger la page pour appliquer les changements
    window.location.reload();
  }
}

// Hook pour l'auth en développement
export function useDevAuth() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('useDevAuth should only be used in development');
  }

  const devUser = getDevUser();
  
  return {
    user: devUser,
    role: devUser.role,
    isAuthenticated: true,
    isLoading: false,
    switchUser: setDevUser,
    availableUsers: Object.keys(DEV_USERS) as DevUserKey[],
  };
}

// Simuler une session NextAuth pour le développement
export function createDevSession(userKey?: DevUserKey) {
  const user = userKey ? DEV_USERS[userKey] : getDevUser();
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.username,
      role: user.role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  };
}

// lib/api-security-dev.ts - Version développement des helpers de sécurité
import { NextRequest, NextResponse } from 'next/server';
import { SecurityContext } from '@/lib/api-security';
import { Role, Permission, hasPermission, canModifyResource } from '@/lib/permissions';

// Version dev du requireAuth qui bypass l'authentification
export async function requireAuthDev(request: NextRequest): Promise<SecurityContext | NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    // En production, utiliser le vrai système
    const { requireAuth } = await import('@/lib/api-security');
    return requireAuth(request);
  }

  // En développement, créer un contexte avec l'utilisateur dev
  const devUser = getDevUser();
  
  const user = {
    id: devUser.id,
    email: devUser.email,
    role: devUser.role as Role,
    username: devUser.username,
  };

  const context: SecurityContext = {
    user,
    hasPermission: (permission: Permission) => hasPermission(user.role, permission),
    canModifyResource: (resourceOwnerId: string, editOwn: Permission, editAll: Permission) => 
      canModifyResource(user.role, user.id, resourceOwnerId, editOwn, editAll),
  };

  return context;
}

// Wrapper pour les routes API en développement  
export function withDevSecurity<T extends any[]>(
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireAuthDev(request);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      return await handler(authResult, ...args);
    } catch (error) {
      console.error('Dev security error:', error);
      return NextResponse.json({
        error: 'Internal dev security error',
        code: 'DEV_ERROR'
      }, { status: 500 });
    }
  };
}