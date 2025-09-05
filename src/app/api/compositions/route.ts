import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

function patternHash(pattern: string[]) {
  return crypto.createHash('sha256').update(JSON.stringify(pattern)).digest('hex');
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const spaceId = req.headers.get('x-space-id') || url.searchParams.get('spaceId') || '';
    if (!spaceId) return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });

    const { pattern, sens, description, statut, source, confidenceScore } = await req.json();
    const hash = patternHash(pattern);

    const existing = await prisma.combination.findFirst({ where: { spaceId, patternHash: hash } });
    if (existing)
      return NextResponse.json({ error: 'COMPOSITION_EXISTS', existing }, { status: 409 });

    const combination = await prisma.combination.create({
      data: {
        spaceId,
        pattern: JSON.stringify(pattern),
        patternHash: hash,
        sens,
        description,
        statut,
        source,
        confidenceScore,
      },
    });

    return NextResponse.json(combination, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const spaceId =
      (req.headers as any).get?.('x-space-id') || url.searchParams.get('spaceId') || '';
    if (!spaceId) return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });

    const compositions = await prisma.combination.findMany({
      where: { spaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        pattern: true,
        sens: true,
        description: true,
        statut: true,
        source: true,
        confidenceScore: true,
        createdAt: true,
        createdBy: true,
      },
    });

    const formatted = compositions.map((c) => ({
      ...c,
      pattern: JSON.parse(c.pattern as unknown as string),
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch compositions' }, { status: 500 });
  }
}
