'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission, type Role } from '@/lib/permissions';

export type UserRole = 'USER' | 'PREMIUM' | 'MODERATOR' | 'ADMIN';
export type UnifiedUser = { id: string; name: string; role: UserRole; email?: string };

type DevAuthState = {
  // attendu par ton useAuth
  user: UnifiedUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // rétro-compat (si d’autres endroits utilisent encore ces champs)
  currentUserId?: string;
  currentUser?: UnifiedUser | null;
  fallbackUsed?: boolean;
};

export function useDevAuth(): DevAuthState {
  const [state, setState] = useState<DevAuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
    fallbackUsed: true,
  });

  useEffect(() => {
    const id = localStorage.getItem('dev.userId') || undefined;
    const username = localStorage.getItem('dev.username') || undefined;
    const role = (localStorage.getItem('dev.role') as UserRole | null) || null;

    if (id && username && role) {
      const user: UnifiedUser = { id, name: username, role };
      setState({
        user,
        role,
        isAuthenticated: true,
        isLoading: false,
        currentUserId: id,
        currentUser: user,
        fallbackUsed: true,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  return state;
}

/**
 * Wrapper unifié:
 * - en dev: lit le state posé par DevHeaderSwitcher via useDevAuth()
 * - en prod: lit la session NextAuth
 */
export function useAuth() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // DEV
  const devAuth = useDevAuth();

  // PROD (ou dev si tu utilises aussi NextAuth localement)
  const { data: session, status } = useSession();

  // Normalisation des sorties
  const user: UnifiedUser | null = isDevelopment
    ? devAuth.user
    : ((session?.user as unknown as UnifiedUser) ?? null);

  const role: Role | null = isDevelopment
    ? (devAuth.role as Role | null)
    : ((session?.user?.role as Role | undefined) ?? null);

  const isAuthenticated = isDevelopment ? devAuth.isAuthenticated : !!session;
  const isLoading = isDevelopment ? devAuth.isLoading : status === 'loading';

  // Helpers attendus par ton code
  const hasRole = (checkRole: Role): boolean => role === checkRole;

  const hasPermissionCheck = (permission: Permission): boolean => {
    if (!isAuthenticated || !role) return false;
    return hasPermission(role, permission);
  };

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission: hasPermissionCheck,
    isDev: isDevelopment,
  };
}
