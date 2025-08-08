import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    const conceptPage = Math.max(1, Number(url.searchParams.get('conceptPage') ?? '1'));
    const conceptPageSize = Math.max(1, Number(url.searchParams.get('conceptPageSize') ?? '6'));
    const comboPage = Math.max(1, Number(url.searchParams.get('comboPage') ?? '1'));
    const comboPageSize = Math.max(1, Number(url.searchParams.get('comboPageSize') ?? '6'));

    // Concepts
    let conceptWhere: any = { isActive: true };
    if (q) {
      const term = q.toLowerCase();
      conceptWhere.OR = [
        { mot: { contains: term, mode: 'insensitive' } },
        { definition: { contains: term, mode: 'insensitive' } },
        {
          conceptProperties: {
            some: { property: { name: { contains: term, mode: 'insensitive' } }
            }
          }
        }
      ];
    }

    const conceptsTotal = await prisma.concept.count({ where: conceptWhere });
    const concepts = await prisma.concept.findMany({
      where: conceptWhere,
      orderBy: [
        { isActive: 'desc' },
        { usageFrequency: 'desc' },
        { mot: 'asc' }
      ],
      skip: (conceptPage - 1) * conceptPageSize,
      take: conceptPageSize,
      include: {
        user: { select: { username: true } },
        conceptProperties: {
          include: { property: { select: { name: true } } }
        }
      }
    });

    const conceptItems = concepts.map((c) => ({
      id: c.id,
      type: 'concept',
      label: c.mot,
      description: c.definition,
      // facultatif: propriétés
    })) as any[];

    // Combinaisons
    const combTotal = await prisma.combination.count({
      where: { statut: { not: 'REFUSE' } }
    });

    const combinations = await prisma.combination.findMany({
      where: { statut: { not: 'REFUSE' } },
      orderBy: { createdAt: 'desc' },
      skip: (comboPage - 1) * comboPageSize,
      take: comboPageSize
    });

    const combItems = combinations.map((cb) => ({
      id: cb.id,
      type: 'combination',
      label: cb.sens || '',
      description: cb.description,
      pattern: cb.pattern ? JSON.parse(cb.pattern) : []
    })) as any[];

    const totalCount = conceptsTotal + combTotal;
    const totalPagesConcepts = Math.ceil(conceptsTotal / conceptPageSize) || 1;
    const totalPagesComb = Math.ceil (combTotal / comboPageSize) || 1; // attention syntax
  } catch (error) {
    console.error('Dictionary API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

}