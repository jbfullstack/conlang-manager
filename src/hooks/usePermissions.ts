// hooks/usePermissions.ts - Version mise à jour
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


export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    role: session?.user?.role as Role,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
  };
}

export function usePermissions() {
  const { user, role, isAuthenticated } = useAuth();
  
  const can = (permission: Permission): boolean => {
    if (!isAuthenticated || !role) return false;
    return hasPermission(role, permission);
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

// Hook pour récupérer l'usage quotidien de l'utilisateur
export function useDailyUsage() {
  const { user, isAuthenticated } = useAuth();
  const [usage, setUsage] = useState<{
    compositionsCreated: number;
    aiSearchRequests: number;
    aiAnalyzeRequests: number;
    conceptsCreated: number;
    estimatedCostUsd: number;
    isLoading: boolean;
    error?: string;
  }>({
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

    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/user/usage', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          setUsage({
            ...data,
            isLoading: false,
          });
        } else {
          setUsage(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Failed to fetch usage data' 
          }));
        }
      } catch (error) {
        setUsage(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Network error' 
        }));
      }
    };

    fetchUsage();
  }, [isAuthenticated, user?.id]);

  // Fonction pour rafraîchir les données d'usage
  const refreshUsage = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setUsage(prev => ({ ...prev, isLoading: true }));
    // Refaire l'appel API
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

// Hook spécialisé pour les compositions avec limites
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
    
    // Limites et usage actuel
    limits,
    hasReachedCompositionLimit,
    remainingCompositions: limits && limits.maxCompositionsPerDay > 0 
      ? Math.max(0, limits.maxCompositionsPerDay - compositionsCreated)
      : -1, // illimité
    
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

// Hook spécialisé pour l'IA avec limites
export function useAIPermissions() {
  const { can, role } = usePermissions();
  const { aiSearchRequests, aiAnalyzeRequests } = useDailyUsage();
  
  const limits = role ? FEATURE_FLAGS[role] : null;
  
  const hasReachedSearchLimit = limits && limits.maxAISearchPerDay > 0 
    ? aiSearchRequests >= limits.maxAISearchPerDay 
    : false;
    
  const hasReachedAnalyzeLimit = limits && limits.maxAIAnalyzePerDay > 0 
    ? aiAnalyzeRequests >= limits.maxAIAnalyzePerDay 
    : false;

  return {
    // Permissions de base
    canUseAISearch: can(PERMISSIONS.USE_AI_SEARCH),
    canUseAIAnalyze: can(PERMISSIONS.USE_AI_ANALYZE),
    
    // Vérification avec limites
    canMakeSearchRequest: can(PERMISSIONS.USE_AI_SEARCH) && !hasReachedSearchLimit,
    canMakeAnalyzeRequest: can(PERMISSIONS.USE_AI_ANALYZE) && !hasReachedAnalyzeLimit,
    
    // État des limites
    hasReachedSearchLimit,
    hasReachedAnalyzeLimit,
    
    // Compteurs restants
    remainingSearches: limits && limits.maxAISearchPerDay > 0 
      ? Math.max(0, limits.maxAISearchPerDay - aiSearchRequests)
      : -1,
    remainingAnalyzes: limits && limits.maxAIAnalyzePerDay > 0 
      ? Math.max(0, limits.maxAIAnalyzePerDay - aiAnalyzeRequests)
      : -1,
    
    // Limites totales
    limits,
  };
}

// Hook pour les concepts
export function useConceptPermissions() {
  const { can, role } = usePermissions();
  const { conceptsCreated } = useDailyUsage();
  
  const limits = role ? FEATURE_FLAGS[role] : null;
  const hasReachedConceptLimit = limits && limits.maxConceptsPerDay > 0 
    ? conceptsCreated >= limits.maxConceptsPerDay 
    : false;

  return {
    canView: can(PERMISSIONS.VIEW_CONCEPTS),
    canCreate: can(PERMISSIONS.CREATE_CONCEPTS) && !hasReachedConceptLimit,
    canEdit: can(PERMISSIONS.EDIT_CONCEPTS),
    canDelete: can(PERMISSIONS.DELETE_CONCEPTS),
    
    // Limites
    limits,
    hasReachedConceptLimit,
    remainingConcepts: limits && limits.maxConceptsPerDay > 0 
      ? Math.max(0, limits.maxConceptsPerDay - conceptsCreated)
      : -1,
  };
}

// Hook pour les actions sécurisées avec feedback utilisateur
export function useSecureActions() {
  const { can } = usePermissions();
  const { refreshUsage } = useDailyUsage();

  const secureAction = async (
    action: () => Promise<any>,
    requiredPermission?: Permission,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    // Vérification permission côté client (UX)
    if (requiredPermission && !can(requiredPermission)) {
      const error = new Error('Permission insuffisante');
      onError?.(error);
      return;
    }

    try {
      const result = await action();
      
      // Rafraîchir les données d'usage après succès
      await refreshUsage();
      
      onSuccess?.(result);
      return result;
    } catch (error: any) {
      console.error('Secure action failed:', error);
      
      // Gestion des différents types d'erreurs
      if (error.status === 401) {
        alert('Vous devez être connecté pour effectuer cette action');
        window.location.href = '/login';
      } else if (error.status === 403) {
        alert('Permission insuffisante pour cette action');
      } else if (error.status === 429) {
        alert('Limite quotidienne atteinte pour cette action');
        await refreshUsage(); // Mettre à jour l'affichage des limites
      } else {
        alert('Erreur lors de l\'action');
      }
      
      onError?.(error);
      throw error;
    }
  };

  return { secureAction };
}

// Hook pour afficher des informations sur les limites et encourager l'upgrade
export function useUpgradePrompts() {
  const { role } = useAuth();
  const usage = useDailyUsage();
  const limits = role ? FEATURE_FLAGS[role] : null;

  const getUpgradePrompt = (actionType: 'composition' | 'aiSearch' | 'aiAnalyze' | 'concept') => {
    if (!limits || role === 'ADMIN') return null;

    const prompts = {
      composition: {
        condition: limits.maxCompositionsPerDay > 0 && 
                  usage.compositionsCreated >= limits.maxCompositionsPerDay * 0.8,
        message: role === 'USER' 
          ? `Vous approchez de votre limite de ${limits.maxCompositionsPerDay} compositions par jour. Passez Premium pour créer jusqu'à 50 compositions !`
          : `${usage.compositionsCreated}/${limits.maxCompositionsPerDay} compositions utilisées aujourd'hui.`,
      },
      aiSearch: {
        condition: role === 'USER',
        message: 'Les recherches IA sont réservées aux comptes Premium. Débloquez cette fonctionnalité !',
      },
      aiAnalyze: {
        condition: role === 'USER',
        message: 'Les analyses IA sont réservées aux comptes Premium. Débloquez cette fonctionnalité !',
      },
      concept: {
        condition: limits.maxConceptsPerDay > 0 && 
                  usage.conceptsCreated >= limits.maxConceptsPerDay * 0.8,
        message: `Vous approchez de votre limite de ${limits.maxConceptsPerDay} concepts par jour.`,
      },
    };

    const prompt = prompts[actionType];
    return prompt.condition ? {
      show: true,
      message: prompt.message,
      canUpgrade: role === 'USER',
    } : null;
  };

  return { getUpgradePrompt };
}