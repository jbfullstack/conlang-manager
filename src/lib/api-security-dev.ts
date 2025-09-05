import { SecurityContext } from '@/lib/api-security';
import { NextRequest, NextResponse } from 'next/server';
import { getDevUser, DEV_USERS } from './dev-auth';
import { Role, Permission, hasPermission, canModifyResource, FEATURE_FLAGS } from './permissions';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// ------------- Usage en mémoire (clé = userId courant) -------------
type Usage = {
  compositionsCreated: number;
  aiSearchRequests: number;
  aiAnalyzeRequests: number;
  conceptsCreated: number;
  estimatedCostUsd: number;
};

const DEV_USAGE_BUCKET = new Map<string, Usage>();

function getUsageBucket(userId: string): Usage {
  let b = DEV_USAGE_BUCKET.get(userId);
  if (!b) {
    b = {
      compositionsCreated: 0,
      aiSearchRequests: 0,
      aiAnalyzeRequests: 0,
      conceptsCreated: 0,
      estimatedCostUsd: 0,
    };
    DEV_USAGE_BUCKET.set(userId, b);
  }
  return b;
}

// ------------- requireAuth (dev) inchangé (sauf dépendance au getDevUser) -------------
export async function requireAuthDev(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const { requireAuth } = await import('@/lib/api-security');
    return requireAuth(request);
  }

  let devUser = getDevUser();

  // 1) header override stays (tests e2e)
  const devUserOverride = request.headers.get('x-dev-user');
  if (devUserOverride && devUserOverride in DEV_USERS) {
    devUser = DEV_USERS[devUserOverride as keyof typeof DEV_USERS];
  }

  // 2) NEW: if a cookie set by /api/dev/resolve-user exists, map to a real DB user
  const resolvedUsername = (await cookies()).get('x-dev-username')?.value;
  if (resolvedUsername) {
    const dbUser = await prisma.user.findUnique({ where: { username: resolvedUsername } });
    if (dbUser) {
      const user = {
        id: dbUser.id, // <-- real DB id => SpaceMember matches
        email: dbUser.email,
        role: dbUser.role as any,
        username: dbUser.username,
      };
      return {
        user,
        hasPermission: (p: any) => hasPermission(user.role, p),
        canModifyResource: (ownerId: string, editOwn: any, editAll: any) =>
          canModifyResource(user.role, user.id, ownerId, editOwn, editAll),
      };
    }
  }

  // fallback to pure dev identity (old behavior)
  const user = {
    id: devUser.id,
    email: devUser.email,
    role: devUser.role as any,
    username: devUser.username,
  };
  return {
    user,
    hasPermission: (p: any) => hasPermission(user.role, p),
    canModifyResource: (ownerId: string, editOwn: any, editAll: any) =>
      canModifyResource(user.role, user.id, ownerId, editOwn, editAll),
  };
}
// ------------- Limites en dev basées sur le RÔLE + bucket dynamique -------------
export async function requireUsageLimitDev(
  request: NextRequest,
  permission: Permission,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated',
): Promise<SecurityContext | NextResponse> {
  const authResult = await requireAuthDev(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!authResult.hasPermission(permission)) {
    return NextResponse.json(
      {
        error: `Permission required: ${permission}`,
        code: 'FORBIDDEN',
        requiredPermission: permission,
      },
      { status: 403 },
    );
  }

  if (process.env.NODE_ENV === 'development') {
    const limits = FEATURE_FLAGS[authResult.user.role];
    const bucket = getUsageBucket(authResult.user.id);

    const limitMap = {
      compositionsCreated: limits.maxCompositionsPerDay,
      aiSearchRequests: limits.maxAISearchPerDay,
      aiAnalyzeRequests: limits.maxAIAnalyzePerDay,
      conceptsCreated: limits.maxConceptsPerDay,
    } as const;

    const limit = limitMap[actionType];
    const current = bucket[actionType];

    if (limit > 0 && current >= limit) {
      return NextResponse.json(
        {
          error: `Daily limit exceeded for ${actionType}`,
          code: 'USAGE_LIMIT_EXCEEDED',
          actionType,
          current,
          limit,
        },
        { status: 429 },
      );
    }

    console.log(
      `🧪 DEV: ${authResult.user.username} (${authResult.user.role}) - ${actionType}: ${current}/${
        limit === -1 ? '∞' : limit
      }`,
    );
  }

  return authResult;
}

export function withDevUsageLimit<T extends any[]>(
  permission: Permission,
  actionType: 'compositionsCreated' | 'aiSearchRequests' | 'aiAnalyzeRequests' | 'conceptsCreated',
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireUsageLimitDev(request, permission, actionType);
      if (authResult instanceof NextResponse) return authResult;

      const response = await handler(authResult, ...args);

      // Incrément simulé en dev sur réponse 2xx
      if (
        response.status >= 200 &&
        response.status < 300 &&
        process.env.NODE_ENV === 'development'
      ) {
        const bucket = getUsageBucket(authResult.user.id);
        bucket[actionType] += 1;
        console.log(
          `🧪 DEV: Usage incremented for ${authResult.user.username}: ${actionType} = ${bucket[actionType]}`,
        );
      }

      return response;
    } catch (error) {
      console.error('Dev usage limit error:', error);
      return NextResponse.json(
        { error: 'Internal dev usage tracking error', code: 'DEV_ERROR' },
        { status: 500 },
      );
    }
  };
}

export function withDevAIPermission<T extends unknown[]>(
  handler: (context: SecurityContext, ...args: T) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const authResult = await requireAuthDev(request);
      if (authResult instanceof NextResponse) return authResult;
      return await handler(authResult, ...(args as T));
    } catch (error) {
      console.error('Dev security error:', error);
      return NextResponse.json(
        { error: 'Internal dev security error', code: 'DEV_ERROR' },
        { status: 500 },
      );
    }
  };
}
