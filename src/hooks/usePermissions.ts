// hooks/usePermissions.ts - Version complète corrigée
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
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

// Types pour l'utilisateur unifié
interface UnifiedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  username?: string;
}

// Hook dev auth simplifié
function useDevAuth() {
  const [currentUser, setCurrentUser] = useState<UnifiedUser>({
    id: 'dev-premium-id',
    email: 'bob@conlang.local',
    name: 'bob',
    role: 'PREMIUM',
    username: 'bob',
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('dev-user') || 'premium';
        const users: Record<string, UnifiedUser> = {
          admin: {
            id: 'dev-admin-id',
            email: 'admin@conlang.local',
            name: 'admin',
            role: 'ADMIN',
            username: 'admin',
          },
          user: {
            id: 'dev-user-id',
            email: 'alice@conlang.local',
            name: 'alice',
            role: 'USER',
            username: 'alice',
          },
          premium: {
            id: 'dev-premium-id',
            email: 'bob@conlang.local',
            name: 'bob',
            role: 'PREMIUM',
            username: 'bob',
          },
          moderator: {
            id: 'dev-moderator-id',
            email: 'charlie@conlang.local',
            name: 'charlie',
            role: 'MODERATOR',
            username: 'charlie',
          },
        };
        
        if (savedUser in users) {
          setCurrentUser(users[savedUser]);
        }
      } catch (error) {
        console.warn('Dev auth error:', error);
      }
    }
  }, []);

  return {
    user: currentUser,
    role: currentUser.role as Role,
    isAuthenticated: true,
    isLoading: !isClient,
  };
}

// Hook principal useAuth - Version simplifiée
export function useAuth() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // En développement, utiliser le système de dev
  const devAuth = isDevelopment ? useDevAuth() : { user: null, role: null, isAuthenticated: false, isLoading: false };
  
  // En production, utiliser NextAuth (maintenant protégé par SessionProvider)
  const { data: session, status } = useSession();
  
  // Déterminer les valeurs finales
  const user = isDevelopment ? devAuth.user : session?.user as UnifiedUser;
  const role = isDevelopment ? devAuth.role : (session?.user?.role as Role);
  const isAuthenticated = isDevelopment ? devAuth.isAuthenticated : !!session;
  const isLoading = isDevelopment ? devAuth.isLoading : status === 'loading';

  // Fonctions utilitaires
  const hasRole = (checkRole: Role): boolean => {
    return role === checkRole;
  };

  const hasPermissionCheck = (permission: Permission): boolean => {
    if (!isAuthenticated || !role) return false;
    return hasPermission(role, permission);
  };

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    // Fonctions qui étaient manquantes
    hasRole,
    hasPermission: hasPermissionCheck,
    // Infos dev
    isDev: isDevelopment,
  };
}

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

// Hook pour l'usage quotidien (version simplifiée pour dev)
export function useDailyUsage() {
  const { user, isAuthenticated, role } = useAuth();
  const [usage, setUsage] = useState({
    compositionsCreated: 0,
    aiSearchRequests: 0,
    aiAnalyzeRequests: 0,
    conceptsCreated: 0,
    estimatedCostUsd: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUsage(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // En développement, utiliser des données mockées
    if (process.env.NODE_ENV === 'development') {
      const mockUsage = getMockUsage(role as Role);
      setUsage({
        ...mockUsage,
        isLoading: false,
      });
      return;
    }

    // En production, vraie API
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/user/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage({ ...data, isLoading: false });
        } else {
          setUsage(prev => ({ ...prev, isLoading: false, error: 'Failed to fetch usage data' }));
        }
      } catch (error) {
        setUsage(prev => ({ ...prev, isLoading: false, error: 'Network error' }));
      }
    };

    fetchUsage();
  }, [isAuthenticated, user?.id, role]);

  const refreshUsage = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setUsage(prev => ({ ...prev, isLoading: true }));
    
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const mockUsage = getMockUsage(role as Role);
        setUsage({ ...mockUsage, isLoading: false });
      }, 300);
      return;
    }

    const response = await fetch('/api/user/usage');
    if (response.ok) {
      const data = await response.json();
      setUsage({ ...data, isLoading: false });
    }
  };

  return {
    ...usage,
    refreshUsage,
  };
}

// Données d'usage mockées selon le rôle
function getMockUsage(role: Role) {
  switch (role) {
    case 'USER':
      return {
        compositionsCreated: 3,
        aiSearchRequests: 0,
        aiAnalyzeRequests: 0,
        conceptsCreated: 1,
        estimatedCostUsd: 0,
      };
    case 'PREMIUM':
      return {
        compositionsCreated: 12,
        aiSearchRequests: 8,
        aiAnalyzeRequests: 5,
        conceptsCreated: 4,
        estimatedCostUsd: 0.35,
      };
    case 'MODERATOR':
      return {
        compositionsCreated: 25,
        aiSearchRequests: 18,
        aiAnalyzeRequests: 12,
        conceptsCreated: 8,
        estimatedCostUsd: 0.78,
      };
    case 'ADMIN':
      return {
        compositionsCreated: 45,
        aiSearchRequests: 32,
        aiAnalyzeRequests: 28,
        conceptsCreated: 15,
        estimatedCostUsd: 2.15,
      };
    default:
      return {
        compositionsCreated: 0,
        aiSearchRequests: 0,
        aiAnalyzeRequests: 0,
        conceptsCreated: 0,
        estimatedCostUsd: 0,
      };
  }
}

// Hook spécialisé pour les compositions
export function useCompositionPermissions() {
  const { can, canModify, role, isAuthenticated } = usePermissions();
  const { compositionsCreated } = useDailyUsage();
  
  const limits = role ? FEATURE_FLAGS[role] : null;
  const hasReachedCompositionLimit = limits && limits.maxCompositionsPerDay > 0 
    ? compositionsCreated >= limits.maxCompositionsPerDay 
    : false;

  return {
    canView: can(PERMISSIONS.VIEW_COMPOSITIONS),
    canCreate: can(PERMISSIONS.CREATE_COMPOSITIONS) && !hasReachedCompositionLimit,
    canUseAI: can(PERMISSIONS.USE_AI_SEARCH) || can(PERMISSIONS.USE_AI_ANALYZE),
    canUseAISearch: can(PERMISSIONS.USE_AI_SEARCH),
    canUseAIAnalyze: can(PERMISSIONS.USE_AI_ANALYZE),
    canModerate: can(PERMISSIONS.MODERATE_COMPOSITIONS),
    
    limits,
    hasReachedCompositionLimit,
    remainingCompositions: limits && limits.maxCompositionsPerDay > 0 
      ? Math.max(0, limits.maxCompositionsPerDay - compositionsCreated)
      : -1,
    
    canEdit: (compositionOwnerId: string) => 
      canModify(
        compositionOwnerId, 
        PERMISSIONS.EDIT_OWN_COMPOSITIONS, 
        PERMISSIONS.EDIT_ALL_COMPOSITIONS
      ),
    
    canDelete: (compositionOwnerId: string) => 
      canModify(
        compositionOwnerId, 
        PERMISSIONS.DELETE_OWN_COMPOSITIONS, 
        PERMISSIONS.DELETE_ALL_COMPOSITIONS
      ),
    
    isAuthenticated,
  };
}