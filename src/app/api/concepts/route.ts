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

    // Recherche par texte (maintenant inclut aussi les propriétés)
    if (search) {
      where.OR = [
        { mot: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
        // Recherche dans les propriétés liées
        {
          conceptProperties: {
            some: {
              property: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
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
        },
        conceptProperties: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true
              }
            }
          }
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
        // Transformer les propriétés liées en array simple pour la compatibilité frontend
        proprietes: c.conceptProperties.map(cp => cp.property.name),
        // Garder aussi les propriétés complètes si besoin d'infos détaillées
        propertiesDetails: c.conceptProperties.map(cp => cp.property),
        exemples: c.exemples ? JSON.parse(c.exemples) : [],
        // Nettoyer la réponse
        conceptProperties: undefined
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

    // Traiter les propriétés - créer celles qui n'existent pas
    let propertyIds: string[] = [];
    
    if (proprietes && Array.isArray(proprietes)) {
      for (const propName of proprietes) {
        // Chercher si la propriété existe déjà
        let property = await prisma.property.findUnique({
          where: { name: propName }
        });
        
        // Si elle n'existe pas, la créer
        if (!property) {
          property = await prisma.property.create({
            data: {
              name: propName,
              category: 'divers' // Catégorie par défaut
            }
          });
        }
        
        propertyIds.push(property.id);
      }
    }

    const concept = await prisma.concept.create({
      data: {
        id,
        mot,
        definition,
        type,
        etymologie,
        exemples: JSON.stringify(exemples || []),
        createdBy: (await prisma.user.findFirst())?.id,
        conceptProperties: {
          create: propertyIds.map(propertyId => ({
            propertyId
          }))
        }
      },
      include: {
        user: {
          select: { username: true }
        },
        conceptProperties: {
          include: {
            property: true
          }
        }
      }
    });

    // Mettre à jour les compteurs d'usage des propriétés
    await updatePropertyUsageCounts(propertyIds);

    return NextResponse.json({ 
      concept: {
        ...concept,
        proprietes: concept.conceptProperties.map(cp => cp.property.name),
        exemples: JSON.parse(concept.exemples || '[]'),
        conceptProperties: undefined
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

// Fonction utilitaire pour mettre à jour les compteurs d'usage
async function updatePropertyUsageCounts(propertyIds: string[]) {
  for (const propertyId of propertyIds) {
    const usageCount = await prisma.conceptProperty.count({
      where: { propertyId }
    });
    
    await prisma.property.update({
      where: { id: propertyId },
      data: { usageCount }
    });
  }
}