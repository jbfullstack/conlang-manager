// lib/api-security-dev.ts - Version développement complète
import { NextRequest, NextResponse } from 'next/server';
import { SecurityContext } from '@/lib/api-security';
import { Role, Permission, hasPermission, canModifyResource, FEATURE_FLAGS } from '@/lib/permissions';
import { DEV_USERS, getDevUser } from '@/lib/dev-auth';

// Simuler l'usage quotidien en développement
const DEV_USAGE_SIMULATION = {
  'dev-admin-id': {
    compositionsCreated: 45,
    aiSearchRequests: 32,
    aiAnalyzeRequests: 28,
    conceptsCreated: 15,
    estimatedCostUsd: 2.15,
  },
  'dev-premium-id': {
    compositionsCreated: 12,
    aiSearchRequests: 8,
    aiAnalyzeRequests: 5,
    conceptsCreated: 4,
    estimatedCostUsd: 0.35,
  },
  'dev-user-id': {
    compositionsCreated: 3,
    aiSearchRequests: 0,
    aiAnalyzeRequests: 0,
    conceptsCreated: 1,
    estimatedCostUsd: 0,
  },
  'dev-moderator-id': {
    compositionsCreated: 25,
    aiSearchRequests: 18,
    aiAnalyzeRequests: 12,
    conceptsCreated: 8,
    estimatedCostUsd: 0.78,
  },
};

// Version dev du requireAuth qui bypass l'authentification
export async function requireAuthDev(request: NextRequest): Promise<SecurityContext | NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    // En production, utiliser le vrai système
    const { requireAuth } = await import('@/lib/api-security');
    return requireAuth(request);
  }

  // En développement, récupérer l'utilisateur depuis le header ou localStorage
  let devUser = getDevUser();
  
  // Permettre de forcer un utilisateur via header (utile pour les tests)
  const devUserOverride = request.headers.get('x-dev-user');
  if (devUserOverride && devUserOverride in DEV_USERS) {
    devUser = DEV_USERS[devUserOverride as keyof typeof DEV_USERS];
  }
  
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

// Simulation des vérifications d'usage en développement
export async function requireUsageLimitDev(
  request: NextRequest,
  permission: Permission,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated'
): Promise<SecurityContext | NextResponse> {
  const authResult = await requireAuthDev(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Vérifier la permission
  if (!authResult.hasPermission(permission)) {
    return NextResponse.json({
      error: `Permission required: ${permission}`,
      code: 'FORBIDDEN',
      requiredPermission: permission
    }, { status: 403 });
  }

  // En développement, simuler les vérifications d'usage
  if (process.env.NODE_ENV === 'development') {
    const limits = FEATURE_FLAGS[authResult.user.role];
    const currentUsage = DEV_USAGE_SIMULATION[authResult.user.id as keyof typeof DEV_USAGE_SIMULATION] || {
      compositionsCreated: 0,
      aiSearchRequests: 0,
      aiAnalyzeRequests: 0,
      conceptsCreated: 0,
      estimatedCostUsd: 0,
    };

    const limitMap = {
      compositionsCreated: limits.maxCompositionsPerDay,
      aiSearchRequests: limits.maxAISearchPerDay,
      aiAnalyzeRequests: limits.maxAIAnalyzePerDay,
      conceptsCreated: limits.maxConceptsPerDay,
    };
    
    const limit = limitMap[actionType];
    const current = currentUsage[actionType];

    if (limit > 0 && current >= limit) {
      return NextResponse.json({
        error: `Daily limit exceeded for ${actionType}`,
        code: 'USAGE_LIMIT_EXCEEDED',
        actionType,
        current,
        limit,
      }, { status: 429 });
    }

    console.log(`🧪 DEV: ${authResult.user.username} (${authResult.user.role}) - ${actionType}: ${current}/${limit === -1 ? '∞' : limit}`);
  }

  return authResult;
}

// Version dev des wrappers API
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

export function withDevUsageLimit<T extends any[]>(
  permission: Permission,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated',
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireUsageLimitDev(request, permission, actionType);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const response = await handler(authResult, ...args);
      
      // En dev, simuler l'incrémentation du compteur
      if (response.status >= 200 && response.status < 300 && process.env.NODE_ENV === 'development') {
        const currentUsage = DEV_USAGE_SIMULATION[authResult.user.id as keyof typeof DEV_USAGE_SIMULATION];
        if (currentUsage) {
          currentUsage[actionType] += 1;
          console.log(`🧪 DEV: Usage incremented for ${authResult.user.username}: ${actionType} = ${currentUsage[actionType]}`);
        }
      }

      return response;
    } catch (error) {
      console.error('Dev usage limit error:', error);
      return NextResponse.json({
        error: 'Internal dev usage tracking error',
        code: 'DEV_ERROR'
      }, { status: 500 });
    }
  };
}

// Version dev des requêtes IA
export function withDevAIPermission<T extends unknown[]>(
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireAuthDev(request);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      // CORRECTION : Cast explicite pour résoudre l'erreur TypeScript
      return await handler(authResult, ...(args as T));
    } catch (error) {
      console.error('Dev security error:', error);
      return NextResponse.json({
        error: 'Internal dev security error',
        code: 'DEV_ERROR'
      }, { status: 500 });
    }
  };
}





// // app/api/search-reverse/route.ts - Version adaptée dev/prod  
// export async function POST(request: NextRequest) {
//   // Simuler une réponse IA en développement
//   if (process.env.NODE_ENV === 'development') {
//     return withDevAIPermission('AI_SEARCH', async (context) => {
//       const { frenchInput } = await request.json();
      
//       if (!frenchInput?.trim()) {
//         return NextResponse.json({
//           error: 'French input is required',
//           code: 'MISSING_INPUT'
//         }, { status: 400 });
//       }

//       // Simuler un délai d'API
//       await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

//       // Réponse simulée intelligente selon l'input
//       const mockResults: Record<string, any> = {
//         'eau rapide': {
//           sens: 'go tomu',
//           confidence: 0.92,
//           justification: 'Combinaison évidente : go (eau) + tomu (vitesse)',
//           source: 'llm',
//           examples: ['cascade', 'torrent', 'rivière rapide'],
//         },
//         'beauté nocturne': {
//           sens: 'nox kala',
//           confidence: 0.85,
//           justification: 'Beauté de la nuit : nox (nuit) + kala (beauté)',
//           source: 'llm',
//           examples: ['ciel étoilé', 'lune brillante'],
//         },
//         'lumière dorée': {
//           sens: 'sol kala',
//           confidence: 0.88,
//           justification: 'Beauté solaire : sol (soleil) + kala (beauté)',
//           source: 'llm',
//           examples: ['coucher de soleil', 'aube dorée'],
//         },
//       };

//       const key = Object.keys(mockResults).find(k => 
//         frenchInput.toLowerCase().includes(k.toLowerCase())
//       );
      
//       const result = key ? mockResults[key] : {
//         sens: 'Combinaison inconnue',
//         confidence: 0.3,
//         justification: `Aucune correspondance claire trouvée pour "${frenchInput}"`,
//         source: 'llm',
//         examples: [],
//       };

//       console.log(`🤖 DEV AI Search: ${context.user.username} searched for "${frenchInput}" -> ${result.sens}`);

//       return NextResponse.json(result);
//     })(request);
//   }

//   // En production, utiliser la vraie logique IA
//   const { withAIPermission } = await import('@/lib/api-security');
//   return withAIPermission('AI_SEARCH', async (context) => {
//     // Votre vraie logique IA ici
//     const { frenchInput } = await request.json();
//     // ... vraie implémentation
//     return NextResponse.json({ sens: 'Production AI result' });
//   })(request);
// }