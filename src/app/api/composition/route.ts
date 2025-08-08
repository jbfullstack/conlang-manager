import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkExistingCombination, saveCombination } from '@/lib/database';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { pattern, sens, description, statut, source, confidenceScore } = await request.json();
    const conceptIds: string[] = pattern ?? [];

    // Option: éviter les doublons
    const existing = await checkExistingCombination(conceptIds);
    if (existing) {
      return NextResponse.json({ message: 'Combination existante', combination: { ...existing, pattern: JSON.parse(existing.pattern) } }, { status: 200 });
    }

    const combo = await saveCombination(conceptIds, sens, source, confidenceScore ?? 0, undefined);
    return NextResponse.json(combo, { status: 201 });
  } catch (error) {
    console.error('Erreur POST composition (alias):', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const combinations = await prisma.combination.findMany({
      where: {
        statut: { not: 'REFUSE' }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return NextResponse.json(combinations);
  } catch (error) {
    console.error('Erreur GET compositions (alias):', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}