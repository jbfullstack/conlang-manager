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

import { useDailyUsage } from './useDailyUsage';
import { useAuth } from './useDevAuth';

const LIMITS_BY_ROLE: Record<string, number> = {
  USER: 5,
  PREMIUM: 50,
  MODERATOR: 50,
  ADMIN: -1,  // -1 = illimité
};

// Types pour l'utilisateur unifié
// interface UnifiedUser {
//   id: string;
//   email: string;
//   name?: string;
//   role: string;
//   username?: string;
// }

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

// Hook pour l'usage quotidien (version simplifiée pour dev)
// export function useDailyUsage() {
//   const { user, isAuthenticated, role } = useAuth();
//   const [usage, setUsage] = useState({
//     compositionsCreated: 0,
//     aiSearchRequests: 0,
//     aiAnalyzeRequests: 0,
//     conceptsCreated: 0,
//     estimatedCostUsd: 0,
//     isLoading: true,
//   });

//   // AJOUT DEBUG : Log à chaque changement de usage
//   useEffect(() => {
//     console.log('🔢 useDailyUsage state changed:', usage);
//   }, [usage]);

//   const fetchUsage = useCallback(async () => {
//     console.log('🔄 fetchUsage called for user:', user?.id);
    
//     if (!isAuthenticated || !user?.id) {
//       console.log('❌ fetchUsage: Not authenticated or no user ID');
//       setUsage(prev => ({ ...prev, isLoading: false }));
//       return;
//     }

//     try {
//       console.log('📡 Fetching usage from API...');
//       const response = await fetch(`/api/user/usage?userId=${user.id}`);
//       console.log('📡 API response status:', response.status);
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log('✅ API returned usage data:', data);
//         setUsage({ ...data, isLoading: false });
//       } else {
//         console.log('⚠️ API error, using mock data');
//         const mockUsage = getMockUsage(role as Role);
//         console.log('⚠️ Mock usage data:', mockUsage);
//         setUsage({ ...mockUsage, isLoading: false });
//       }
//     } catch (error) {
//       console.error('❌ Error fetching usage:', error);
//       const mockUsage = getMockUsage(role as Role);
//       setUsage({ ...mockUsage, isLoading: false });
//     }
//   }, [isAuthenticated, user?.id, role]);

//   useEffect(() => {
//     fetchUsage();
//   }, [fetchUsage]);

//   const refreshUsage = async () => {
//     if (!isAuthenticated || !user?.id) return;
    
//     setUsage(prev => ({ ...prev, isLoading: true }));
//     await fetchUsage();
//   };

//   const incrementUsage = async (type: 'compositions' | 'aiSearch' | 'aiAnalyze' | 'concepts') => {
//     if (!isAuthenticated || !user?.id) {
//       console.warn('⚠️ incrementUsage: User not authenticated or no user ID');
//       return;
//     }
    
//     console.log('🚀 incrementUsage called with:', { type, userId: user.id });
//     console.log('🚀 Current usage BEFORE increment:', usage);
    
//     try {
//       const url = `/api/user/usage?userId=${user.id}`;
//       const body = { increment: type };
      
//       console.log('🚀 Making POST request to:', url, 'with body:', body);
      
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body)
//       });
      
//       console.log('🚀 POST Response status:', response.status);
      
//       if (response.ok) {
//         const updatedUsage = await response.json();
//         console.log('✅ Updated usage from API:', updatedUsage);
//         console.log('✅ Previous local usage:', usage);
        
//         setUsage(prev => {
//           const newUsage = {
//             ...prev,
//             compositionsCreated: updatedUsage.compositionsCreated,
//             aiSearchRequests: updatedUsage.aiSearchRequests,
//             aiAnalyzeRequests: updatedUsage.aiAnalyzeRequests,
//             conceptsCreated: updatedUsage.conceptsCreated,
//             estimatedCostUsd: updatedUsage.estimatedCostUsd,
//           };
//           console.log('✅ New local usage AFTER setUsage:', newUsage);
//           return newUsage;
//         });
//       } else {
//         const errorText = await response.text();
//         console.error('❌ API POST response not ok:', response.status, errorText);
//       }
//     } catch (error) {
//       console.error('❌ Error in incrementUsage:', error);
//     }
//   };

//   const incrementComposition = () => {
//     console.log('🎯 incrementComposition called');
//     return incrementUsage('compositions');
//   };

//   const incrementAISearch = () => incrementUsage('aiSearch');
//   const incrementAIAnalyze = () => incrementUsage('aiAnalyze');
//   const incrementConcept = () => incrementUsage('concepts');

//   return {
//     ...usage,
//     refreshUsage,
//     incrementComposition,
//     incrementAISearch,
//     incrementAIAnalyze,
//     incrementConcept,
//   };
// }


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

  const canCreate = role !== 'USER' ? true : true; // à adapter si tu veux restreindre
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
