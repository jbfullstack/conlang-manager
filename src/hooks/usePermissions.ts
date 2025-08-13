import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  canModifyResource,
  PERMISSIONS,
  FEATURE_FLAGS,
  Role,
  Permission
} from '@/lib/permissions';

import { useDailyUsage } from './useDailyUsage';
import { useAuth } from './useDevAuth';

const LIMITS_BY_ROLE: Record<string, number> = {
  USER: 5,
  PREMIUM: 50,
  MODERATOR: 50,
  ADMIN: -1,  // -1 = illimité
};

type UserRole = 'USER' | 'PREMIUM' | 'MODERATOR' | 'ADMIN';

export function useDevAuth() {
  const [state, setState] = useState({
    currentUserId: undefined as string | undefined,
    currentUser: undefined as { id: string; name: string; role: UserRole } | undefined,
    fallbackUsed: true,
    isLoading: true,
  });

  useEffect(() => {
    const id = localStorage.getItem('dev.userId') || undefined;
    const username = localStorage.getItem('dev.username') || 'dev_user';
    const role = (localStorage.getItem('dev.role') as UserRole) || 'USER';

    setState({
      currentUserId: id,
      currentUser: id ? { id, name: username, role } : undefined,
      fallbackUsed: true,
      isLoading: false,
    });
  }, []);

  return state;
}
// Hook principal useAuth - Version simplifiée
// export function useAuth() {
//   const isDevelopment = process.env.NODE_ENV === 'development';
  
//   // En développement, utiliser le système de dev
//   const devAuth = isDevelopment ? useDevAuth() : { user: null, role: null, isAuthenticated: false, isLoading: false };
  
//   // En production, utiliser NextAuth (maintenant protégé par SessionProvider)
//   const { data: session, status } = useSession();
  
//   // Déterminer les valeurs finales
//   const user = isDevelopment ? devAuth.user : session?.user as UnifiedUser;
//   const role = isDevelopment ? devAuth.role : (session?.user?.role as Role);
//   const isAuthenticated = isDevelopment ? devAuth.isAuthenticated : !!session;
//   const isLoading = isDevelopment ? devAuth.isLoading : status === 'loading';

//   // Fonctions utilitaires
//   const hasRole = (checkRole: Role): boolean => {
//     return role === checkRole;
//   };

//   const hasPermissionCheck = (permission: Permission): boolean => {
//     if (!isAuthenticated || !role) return false;
//     return hasPermission(role, permission);
//   };

//   return {
//     user,
//     role,
//     isAuthenticated,
//     isLoading,
//     // Fonctions qui étaient manquantes
//     hasRole,
//     hasPermission: hasPermissionCheck,
//     // Infos dev
//     isDev: isDevelopment,
//   };
// }

// Hook pour les permissions (utilise useAuth)
export function usePermissions() {
  const { user, role, isAuthenticated, hasPermission: authHasPermission } = useAuth();
  
  const can = (permission: Permission): boolean => {
    return authHasPermission(permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    if (!isAuthenticated || !role) return false;
    return hasAnyPermission(role, permissions);
  };

  const canAll = (permissions: Permission[]): boolean => {
    if (!isAuthenticated || !role) return false;
    return hasAllPermissions(role, permissions);
  };

  const canModify = (
    resourceOwnerId: string,
    editOwnPermission: Permission,
    editAllPermission: Permission
  ): boolean => {
    if (!isAuthenticated || !role || !user?.id) return false;
    return canModifyResource(role, user.id, resourceOwnerId, editOwnPermission, editAllPermission);
  };

  return {
    can,
    canAny,
    canAll,
    canModify,
    role,
    isAuthenticated,
  };
}

export function useCompositionPermissions() {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const maxCompositionsPerDay = LIMITS_BY_ROLE[role] ?? 5;

  const { compositionsCreated } = useDailyUsage();
  const remaining =
    maxCompositionsPerDay === -1
      ? -1
      : compositionsCreated != null
      ? Math.max(0, maxCompositionsPerDay - compositionsCreated)
      : undefined;

  const canCreate =
    (maxCompositionsPerDay === -1) ||
    (compositionsCreated != null && compositionsCreated < maxCompositionsPerDay);

  const canUseAISearch = role === 'PREMIUM' || role === 'MODERATOR' || role === 'ADMIN';
  const canUseAIAnalyze = canUseAISearch;

  return {
    canUseAISearch,
    canUseAIAnalyze,
    canCreate,
    limits: { maxCompositionsPerDay },
    remainingCompositions: remaining,
    hasReachedCompositionLimit:
      maxCompositionsPerDay !== -1 &&
      compositionsCreated != null &&
      compositionsCreated >= maxCompositionsPerDay,
  };
}
