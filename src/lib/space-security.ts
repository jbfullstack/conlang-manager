// src/lib/space-security.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

/**
 * Lit spaceId depuis Header ou query.
 */
export function getSpaceFromRequest(req: NextRequest) {
  const header = req.headers.get('x-space-id') || '';
  const url = new URL(req.url);
  const qp = url.searchParams.get('spaceId') || '';
  const spaceId = header || qp;
  return spaceId;
}

/**
 * NEW — si aucun spaceId explicite, on prend le 1er espace actif du user.
 * Évite les 400 au premier rendu quand le client n’a pas encore persisté l’ID.
 */
export async function resolveSpaceIdOrDefault(req: NextRequest, userId: string) {
  const direct = getSpaceFromRequest(req);
  if (direct) return direct;

  const space = await prisma.space.findUnique({ where: { slug: direct } });
  if (space) return space.id;

  const membership = await prisma.spaceMember.findFirst({
    where: { userId, isActive: true, space: { status: { in: ['ACTIVE', 'PENDING'] } } },
    orderBy: { createdAt: 'asc' },
  });

  return membership?.spaceId || '';
}

/**
 * Vérifie l’appartenance à un espace + rôles optionnels.
 * Utilise resolveSpaceIdOrDefault pour éviter SPACE_REQUIRED.
 */
export async function requireSpaceMembership(
  req: NextRequest,
  roles?: ('OWNER' | 'MODERATOR' | 'MADROLE' | 'MEMBER')[],
) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  const spaceId = await resolveSpaceIdOrDefault(req, auth.user.id);
  if (!spaceId) {
    // Aucun espace pour cet utilisateur
    return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });
  }

  const member = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: auth.user.id } },
  });

  if (!member || !member.isActive) {
    return NextResponse.json({ error: 'NOT_A_MEMBER', spaceId }, { status: 403 });
  }

  if (roles && roles.length > 0 && !roles.includes(member.role as any)) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_SPACE_ROLE', have: member.role, need: roles },
      { status: 403 },
    );
  }

  return { auth, spaceId, member };
}
