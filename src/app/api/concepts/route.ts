import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let where: any = { isActive: true };

    // Recherche par texte
    if (search) {
      where.OR = [
        { mot: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par type
    if (type) {
      where.type = type;
    }

    const concepts = await prisma.concept.findMany({
      where,
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: [
        { usageFrequency: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({ 
      concepts: concepts.map(c => ({
        ...c,
        proprietes: c.proprietes ? JSON.parse(c.proprietes) : [],
        exemples: c.exemples ? JSON.parse(c.exemples) : []
      }))
    });
  } catch (error) {
    console.error('Erreur GET concepts:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, mot, definition, type, proprietes, etymologie, exemples } = body;

    // Validation basique
    if (!id || !mot || !definition || !type) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier unicité
    const existing = await prisma.concept.findFirst({
      where: {
        OR: [
          { id },
          { mot }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Concept ou mot déjà existant' },
        { status: 409 }
      );
    }

    const concept = await prisma.concept.create({
      data: {
        id,
        mot,
        definition,
        type,
        proprietes: JSON.stringify(proprietes || []),
        etymologie,
        exemples: JSON.stringify(exemples || []),
        // Note: createdBy should come from auth, but for now we'll use first user
        createdBy: (await prisma.user.findFirst())?.id
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({ 
      concept: {
        ...concept,
        proprietes: JSON.parse(concept.proprietes || '[]'),
        exemples: JSON.parse(concept.exemples || '[]')
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}