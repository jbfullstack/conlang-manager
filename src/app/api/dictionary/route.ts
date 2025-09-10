import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveSpaceIdOrDefault, requireSpaceMembership } from '@/lib/space-security';
import { requireAuthDev } from '@/lib/api-security-dev';

export async function GET(request: NextRequest) {
  try {
    await requireAuthDev(request);
    const url = new URL(request.url);

    const authResult = await requireSpaceMembership(request, ['MEMBER']);
    if (authResult instanceof Response) return authResult;

    const userId = authResult.member.id;
    const spaceId = await resolveSpaceIdOrDefault(request, userId);

    const q = url.searchParams.get('q') ?? '';
    const conceptPage = Math.max(1, Number(url.searchParams.get('conceptPage') ?? '1'));
    const conceptPageSize = Math.max(1, Number(url.searchParams.get('conceptPageSize') ?? '6'));
    const comboPage = Math.max(1, Number(url.searchParams.get('comboPage') ?? '1'));
    const comboPageSize = Math.max(1, Number(url.searchParams.get('comboPageSize') ?? '6'));

    // Concepts (scopés)
    let conceptWhere: any = { spaceId, isActive: true };
    if (q) {
      const term = q.toLowerCase();
      conceptWhere.OR = [
        { mot: { contains: term, mode: 'insensitive' } },
        { definition: { contains: term, mode: 'insensitive' } },
        {
          conceptProperties: {
            some: { property: { name: { contains: term, mode: 'insensitive' } } },
          },
        },
      ];
    }

    const conceptsTotal = await prisma.concept.count({ where: conceptWhere });
    const concepts = await prisma.concept.findMany({
      where: conceptWhere,
      orderBy: [{ isActive: 'desc' }, { usageFrequency: 'desc' }, { mot: 'asc' }],
      skip: (conceptPage - 1) * conceptPageSize,
      take: conceptPageSize,
      include: {
        user: { select: { username: true } },
        conceptProperties: { include: { property: { select: { name: true } } } },
      },
    });

    // Combinations (scopées)
    const combWhere: any = { spaceId, statut: { not: 'REFUSE' } };
    const combTotal = await prisma.combination.count({ where: combWhere });
    const combinations = await prisma.combination.findMany({
      where: combWhere,
      orderBy: { createdAt: 'desc' },
      skip: (comboPage - 1) * comboPageSize,
      take: comboPageSize,
    });

    return NextResponse.json({
      concepts,
      combinations,
      counts: { concepts: conceptsTotal, combinations: combTotal },
      pages: {
        concepts: Math.max(1, Math.ceil(conceptsTotal / conceptPageSize)),
        combinations: Math.max(1, Math.ceil(combTotal / comboPageSize)),
      },
    });
  } catch (error) {
    console.error('Dictionary API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
