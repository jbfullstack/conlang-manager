// hooks/usePermissions.ts - Version complète corrigée
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
    id: 'cme6wmg500002k5m41d0swmwh',
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
            id: 'cme6wmg4t0000k5m4wwwowp5c',
            email: 'admin@conlang.local',
            name: 'admin',
            role: 'ADMIN',
            username: 'admin',
          },
          user: {
            id: 'cme6wmg500001k5m4be23k1gk',
            email: 'alice@conlang.local',
            name: 'alice',
            role: 'USER',
            username: 'alice',
          },
          premium: {
            id: 'cme6wmg500002k5m41d0swmwh',
            email: 'bob@conlang.local',
            name: 'bob',
            role: 'PREMIUM',
            username: 'bob',
          },
          moderator: {
            id: 'cme6wmg520003k5m4mzldl9ju',
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

  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUsage(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch(`/api/user/usage?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUsage({ ...data, isLoading: false });
      } else {
        const mockUsage = getMockUsage(role as Role);
        setUsage({ ...mockUsage, isLoading: false });
      }
    } catch (error) {
      console.error('Erreur fetch usage:', error);
      const mockUsage = getMockUsage(role as Role);
      setUsage({ ...mockUsage, isLoading: false });
    }
  }, [isAuthenticated, user?.id, role]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const refreshUsage = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setUsage(prev => ({ ...prev, isLoading: true }));
    await fetchUsage();
  };

  // AJOUTEZ CETTE FONCTION :
  const incrementUsage = async (type: 'compositions' | 'aiSearch' | 'aiAnalyze' | 'concepts') => {
    if (!isAuthenticated || !user?.id) {
      console.warn('⚠️ incrementUsage: User not authenticated or no user ID');
      return;
    }
    
    console.log('🚀 incrementUsage called with:', { type, userId: user.id });
    
    try {
      const url = `/api/user/usage?userId=${user.id}`;
      const body = { increment: type };
      
      console.log('🚀 Making POST request to:', url, 'with body:', body);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      console.log('🚀 Response status:', response.status);
      
      if (response.ok) {
        const updatedUsage = await response.json();
        console.log('✅ Updated usage from API:', updatedUsage);
        
        setUsage(prev => {
          const newUsage = {
            ...prev,
            compositionsCreated: updatedUsage.compositionsCreated,
            aiSearchRequests: updatedUsage.aiSearchRequests,
            aiAnalyzeRequests: updatedUsage.aiAnalyzeRequests,
            conceptsCreated: updatedUsage.conceptsCreated,
            estimatedCostUsd: updatedUsage.estimatedCostUsd,
          };
          console.log('✅ Local state updated:', newUsage);
          return newUsage;
        });
      } else {
        const errorText = await response.text();
        console.error('❌ API response not ok:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error in incrementUsage:', error);
    }
  };

  // AJOUTEZ CES FONCTIONS :
  const incrementComposition = () => {
    console.log('🎯 incrementComposition called');
    return incrementUsage('compositions');
  };

  const incrementAISearch = () => incrementUsage('aiSearch');
  const incrementAIAnalyze = () => incrementUsage('aiAnalyze');
  const incrementConcept = () => incrementUsage('concepts');

  return {
    ...usage,
    refreshUsage,
    incrementComposition,
    incrementAISearch,
    incrementAIAnalyze,
    incrementConcept,
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
  
  // CHANGEMENT: Utiliser directement useDailyUsage au lieu de dupliquer
  const { compositionsCreated, isLoading: usageLoading } = useDailyUsage();
  
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
    
    // CHANGEMENT: Calcul en temps réel basé sur useDailyUsage
    remainingCompositions: limits && limits.maxCompositionsPerDay > 0 
      ? Math.max(0, limits.maxCompositionsPerDay - compositionsCreated)
      : -1,
    
    // Exposer les données d'usage
    compositionsToday: compositionsCreated,
    loadingCount: usageLoading,
    
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