import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    let where: any = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { sens: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const combinations = await prisma.combination.findMany({
      where,
      include: {
        user: {
          select: { username: true }
        },
        votes: {
          include: {
            user: {
              select: { username: true }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      },
      orderBy: [
        { confidenceScore: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    const formattedCombinations = combinations.map((c: { pattern: string; _count: { votes: any; }; votes: { filter: (arg0: { (v: any): boolean; (v: any): boolean; (v: any): boolean; }) => { (): any; new(): any; length: any; }; }; }) => ({
      ...c,
      pattern: JSON.parse(c.pattern),
      voteStats: {
        total: c._count.votes,
        pour: c.votes.filter(v => v.vote === 'POUR').length,
        contre: c.votes.filter(v => v.vote === 'CONTRE').length,
        abstention: c.votes.filter(v => v.vote === 'ABSTENTION').length
      }
    }));

    return NextResponse.json({ combinations: formattedCombinations });
  } catch (error) {
    console.error('Erreur GET combinations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pattern, sens, description } = body;

    if (!pattern || !Array.isArray(pattern) || pattern.length < 2) {
      return NextResponse.json(
        { error: 'Pattern invalide (minimum 2 concepts)' },
        { status: 400 }
      );
    }

    if (!sens) {
      return NextResponse.json(
        { error: 'Sens requis' },
        { status: 400 }
      );
    }

    const combination = await prisma.combination.create({
      data: {
        pattern: JSON.stringify(pattern),
        sens,
        description,
        source: 'MANUAL',
        // Note: createdBy should come from auth
        createdBy: (await prisma.user.findFirst())?.id
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({
      combination: {
        ...combination,
        pattern: JSON.parse(combination.pattern)
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST combination:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}