// lib/api-security.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission, canModifyResource, Permission, Role } from '@/lib/permissions';
import { canPerformAction, incrementUsage, logAIRequest, checkPremiumStatus } from '@/lib/usage-tracking';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  username?: string;
  premiumUntil?: Date | null;
}

export interface SecurityContext {
  user: AuthenticatedUser;
  hasPermission: (permission: Permission) => boolean;
  canModifyResource: (resourceOwnerId: string, editOwn: Permission, editAll: Permission) => boolean;
}

// Helper principal pour l'authentification avec vérification premium
export async function requireAuth(request: NextRequest): Promise<SecurityContext | NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ 
      error: 'Authentication required',
      code: 'UNAUTHORIZED' 
    }, { status: 401 });
  }

  const user: AuthenticatedUser = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as Role,
    username: session.user.username,
    premiumUntil: session.user.premiumUntil,
  };

  // Vérifier le statut premium si applicable
  if (user.role === 'PREMIUM') {
    const isPremiumValid = await checkPremiumStatus(user.id);
    if (!isPremiumValid) {
      // Le rôle a été mis à jour automatiquement vers USER
      user.role = 'USER';
    }
  }

  const context: SecurityContext = {
    user,
    hasPermission: (permission: Permission) => hasPermission(user.role, permission),
    canModifyResource: (resourceOwnerId: string, editOwn: Permission, editAll: Permission) => 
      canModifyResource(user.role, user.id, resourceOwnerId, editOwn, editAll),
  };

  return context;
}

// Helper pour vérifier une permission spécifique
export async function requirePermission(
  request: NextRequest, 
  permission: Permission
): Promise<SecurityContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  // Si c'est déjà une erreur, la retourner
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult.hasPermission(permission)) {
    return NextResponse.json({
      error: `Permission required: ${permission}`,
      code: 'FORBIDDEN',
      requiredPermission: permission
    }, { status: 403 });
  }

  return authResult;
}

// Helper pour vérifier les limites d'usage AVANT d'effectuer une action
export async function requireUsageLimit(
  request: NextRequest,
  permission: Permission,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated'
): Promise<SecurityContext | NextResponse> {
  const authResult = await requirePermission(request, permission);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Vérifier les limites d'usage
  const usageCheck = await canPerformAction(authResult.user.id, authResult.user.role, actionType);
  
  if (!usageCheck.allowed) {
    return NextResponse.json({
      error: usageCheck.message || `Daily limit exceeded for ${actionType}`,
      code: 'USAGE_LIMIT_EXCEEDED',
      actionType,
      current: usageCheck.current,
      limit: usageCheck.limit,
    }, { status: 429 });
  }

  return authResult;
}

// Helper spécialisé pour les requêtes IA avec tracking
export async function requireAIPermission(
  request: NextRequest,
  aiType: 'AI_SEARCH' | 'AI_ANALYZE',
  inputData: any
): Promise<SecurityContext | NextResponse> {
  const permission = aiType === 'AI_SEARCH' ? 'USE_AI_SEARCH' : 'USE_AI_ANALYZE';
  const usageType = aiType === 'AI_SEARCH' ? 'aiSearchRequests' : 'aiAnalyzeRequests';
  
  const authResult = await requireUsageLimit(request, permission as Permission, usageType);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Log de la tentative de requête IA (même si elle échoue après)
  try {
    await logAIRequest(
      authResult.user.id,
      aiType,
      inputData,
      null, // pas encore de résultat
      undefined, // pas encore de métriques
      'SUCCESS' // sera mis à jour si erreur
    );
  } catch (error) {
    console.error('Failed to log AI request attempt:', error);
    // Ne pas bloquer la requête pour autant
  }

  return authResult;
}

// Helper pour incrémenter l'usage après succès d'une action
export async function trackUsageSuccess(
  userId: string,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated',
  amount: number = 1
): Promise<void> {
  try {
    await incrementUsage(userId, actionType, amount);
  } catch (error) {
    console.error('Failed to track usage:', error);
    // Ne pas faire échouer la requête pour des problèmes de tracking
  }
}

// Helper pour vérifier plusieurs permissions (OU logique)
export async function requireAnyPermission(
  request: NextRequest, 
  permissions: Permission[]
): Promise<SecurityContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const hasAnyPermission = permissions.some(permission => 
    authResult.hasPermission(permission)
  );

  if (!hasAnyPermission) {
    return NextResponse.json({
      error: `One of these permissions required: ${permissions.join(', ')}`,
      code: 'FORBIDDEN',
      requiredPermissions: permissions
    }, { status: 403 });
  }

  return authResult;
}

// Helper pour vérifier un rôle spécifique
export async function requireRole(
  request: NextRequest, 
  role: Role
): Promise<SecurityContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.user.role !== role) {
    return NextResponse.json({
      error: `Role required: ${role}`,
      code: 'FORBIDDEN',
      requiredRole: role,
      userRole: authResult.user.role
    }, { status: 403 });
  }

  return authResult;
}

// Helper pour vérifier la propriété d'une ressource
export async function requireResourceOwnership(
  request: NextRequest,
  resourceOwnerId: string,
  editOwnPermission: Permission,
  editAllPermission: Permission
): Promise<SecurityContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult.canModifyResource(resourceOwnerId, editOwnPermission, editAllPermission)) {
    return NextResponse.json({
      error: 'You can only modify your own resources or need elevated permissions',
      code: 'FORBIDDEN',
      requiredPermissions: [editOwnPermission, editAllPermission]
    }, { status: 403 });
  }

  return authResult;
}


// Wrapper spécialisé pour les routes avec permission ET limite d'usage
export function withUsageLimit<T extends any[]>(
  permission: Permission,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated',
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireUsageLimit(request, permission, actionType);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const response = await handler(authResult, ...args);
      
      // Si succès (status 2xx), incrémenter le compteur
      if (response.status >= 200 && response.status < 300) {
        await trackUsageSuccess(authResult.user.id, actionType);
      }

      return response;
    } catch (error) {
      console.error('Usage limit error:', error);
      return NextResponse.json({
        error: 'Internal usage tracking error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 });
    }
  };
}

// Wrapper spécialisé pour les routes IA
export function withAIPermission<T extends any[]>(
  aiType: 'AI_SEARCH' | 'AI_ANALYZE',
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const authResult = await requireAIPermission(request, aiType, body);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const startTime = Date.now();
      const response = await handler(authResult, ...args);
      const endTime = Date.now();

      // Logger le résultat de la requête IA
      if (response.status >= 200 && response.status < 300) {
        const responseData = await response.clone().json().catch(() => null);
        await logAIRequest(
          authResult.user.id,
          aiType,
          body,
          responseData,
          {
            responseTime: endTime - startTime,
            // tokensUsed et costUsd seront ajoutés par le handler si disponibles
          },
          'SUCCESS'
        );
      } else {
        await logAIRequest(
          authResult.user.id,
          aiType,
          body,
          null,
          { responseTime: endTime - startTime },
          'ERROR',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response;
    } catch (error) {
      console.error('AI permission error:', error);
      return NextResponse.json({
        error: 'Internal AI processing error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 });
    }
  };
}


// Helper pour limiter les taux d'appel selon le rôle
export async function applyRoleBasedRateLimit(
  request: NextRequest,
  limits: Record<Role, number>
): Promise<boolean> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return false;
  }

  const userLimit = limits[authResult.user.role];
  if (!userLimit) return true;

  // Ici tu peux intégrer une librairie de rate limiting comme @upstash/ratelimit
  // avec des limites différentes selon le rôle
  
  return true; // Simplified for example
}

// Wrapper pour gérer les erreurs de sécurité de façon uniforme
export function withSecurity<T extends any[]>(
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireAuth(request);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      return await handler(authResult, ...args);
    } catch (error) {
      console.error('Security error:', error);
      return NextResponse.json({
        error: 'Internal security error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 });
    }
  };
}

// Wrapper spécialisé pour les routes avec permission
export function withPermission<T extends any[]>(
  permission: Permission,
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requirePermission(request, permission);
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      return await handler(authResult, ...args);
    } catch (error) {
      console.error('Permission error:', error);
      return NextResponse.json({
        error: 'Internal permission error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 });
    }
  };
}