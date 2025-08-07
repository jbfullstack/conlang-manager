import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de recherche et filtrage
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    
    // Paramètres de pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));

    // Mode de compatibilité - si pas de paramètres de pagination, comportement existant
    if (!searchParams.has('page') && !searchParams.has('pageSize')) {
      // Comportement legacy pour les appels existants
      let where: any = { isActive: true };

      if (search) {
        const term = search.toLowerCase();
        where.OR = [
          { mot: { contains: term, mode: 'insensitive' } },
          { definition: { contains: term, mode: 'insensitive' } },
          { 
            conceptProperties: {
              some: {
                property: {
                  name: { contains: term, mode: 'insensitive' }
                }
              }
            }
          }
        ];
      }

      if (type && type !== 'all') {
        where.type = type;
      }

      const concepts = await prisma.concept.findMany({
        where,
        orderBy: [
          { usageFrequency: 'desc' },
          { mot: 'asc' }
        ],
        include: {
          user: {
            select: { username: true }
          },
          conceptProperties: {
            include: {
              property: {
                select: { name: true }
              }
            }
          }
        }
      });

      // Transformer pour compatibilité avec l'ancien format
      const conceptsWithProperties = concepts.map(concept => ({
        ...concept,
        proprietes: concept.conceptProperties.map(cp => cp.property.name),
        exemples: concept.exemples ? JSON.parse(concept.exemples) : []
      }));

      return NextResponse.json({ concepts: conceptsWithProperties });
    }

    // Nouveau mode paginé avec filtrage global
    let where: any = {};

    // Filtrage par recherche textuelle
    if (search) {
      const term = search.toLowerCase();
      where.OR = [
        { mot: { contains: term, mode: 'insensitive' } },
        { definition: { contains: term, mode: 'insensitive' } },
        { type: { contains: term, mode: 'insensitive' } },
        { etymologie: { contains: term, mode: 'insensitive' } },
        {
          conceptProperties: {
            some: {
              property: {
                name: { contains: term, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    // Filtrage par type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Compte total (pour la pagination)
    const totalCount = await prisma.concept.count({ where });

    // Calcul de la pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Récupération des concepts avec pagination
    const concepts = await prisma.concept.findMany({
      where,
      orderBy: [
        { isActive: 'desc' }, // Concepts actifs en premier
        { usageFrequency: 'desc' }, // Puis par fréquence d'usage
        { mot: 'asc' } // Puis par ordre alphabétique
      ],
      skip,
      take: pageSize,
      include: {
        user: {
          select: { username: true }
        },
        conceptProperties: {
          include: {
            property: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Transformer pour compatibilité avec l'ancien format
    const conceptsWithProperties = concepts.map(concept => ({
      ...concept,
      proprietes: concept.conceptProperties.map(cp => cp.property.name),
      exemples: concept.exemples ? JSON.parse(concept.exemples) : []
    }));

    // Informations de pagination
    const pagination = {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startItem: totalCount > 0 ? skip + 1 : 0,
      endItem: Math.min(skip + pageSize, totalCount)
    };

    return NextResponse.json({ 
      concepts: conceptsWithProperties,
      pagination,
      totalCount, // Pour compatibilité
    });
    
  } catch (error) {
    console.error('Erreur GET concepts:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des concepts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mot,
      definition,
      type,
      proprietes = [],
      etymologie,
      exemples = [],
    } = body;

    // Validation
    if (!mot || !definition || !type) {
      return NextResponse.json(
        { error: 'Les champs mot, définition et type sont obligatoires' },
        { status: 400 }
      );
    }

    if (mot.length < 2 || mot.length > 100) {
      return NextResponse.json(
        { error: 'Le mot doit contenir entre 2 et 100 caractères' },
        { status: 400 }
      );
    }

    if (definition.length < 10 || definition.length > 500) {
      return NextResponse.json(
        { error: 'La définition doit contenir entre 10 et 500 caractères' },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du mot
    const existingConcept = await prisma.concept.findFirst({
      where: {
        mot: {
          equals: mot.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingConcept) {
      return NextResponse.json(
        { error: 'Un concept avec ce mot existe déjà' },
        { status: 409 }
      );
    }

    // Créer le concept d'abord
    const newConcept = await prisma.concept.create({
      data: {
        id: mot.trim(),
        mot: mot.trim(),
        definition: definition.trim(),
        type: type.trim(),
        etymologie: etymologie?.trim(),
        exemples: JSON.stringify(Array.isArray(exemples) ? exemples.filter(e => e?.trim()) : []),
        usageFrequency: 0,
        isActive: true
      }
    });

    // Traiter les propriétés avec création automatique et liaison
    const propertyIds: string[] = [];
    
    for (const propertyName of proprietes) {
      if (!propertyName?.trim()) continue;
      
      const normalizedName = propertyName.trim().toLowerCase();
      
      // Vérifier si la propriété existe
      let property = await prisma.property.findFirst({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive'
          }
        }
      });

      // Créer la propriété si elle n'existe pas
      if (!property) {
        property = await prisma.property.create({
          data: {
            name: normalizedName,
            description: `Propriété générée automatiquement pour "${normalizedName}"`,
            category: 'custom',
            usageCount: 0,
            isActive: true
          }
        });
      }

      // Incrémenter le compteur d'usage
      await prisma.property.update({
        where: { id: property.id },
        data: { usageCount: { increment: 1 } }
      });

      // Créer la relation concept-property
      await prisma.conceptProperty.create({
        data: {
          conceptId: newConcept.id,
          propertyId: property.id
        }
      });

      propertyIds.push(property.id);
    }

    // Récupérer le concept avec ses relations pour la réponse
    const conceptWithRelations = await prisma.concept.findUnique({
      where: { id: newConcept.id },
      include: {
        user: {
          select: { username: true }
        },
        conceptProperties: {
          include: {
            property: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Transformer pour compatibilité
    const conceptResponse = {
      ...conceptWithRelations,
      proprietes: conceptWithRelations?.conceptProperties.map(cp => cp.property.name) || [],
      exemples: conceptWithRelations?.exemples ? JSON.parse(conceptWithRelations.exemples) : []
    };

    return NextResponse.json({
      message: 'Concept créé avec succès',
      concept: conceptResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du concept' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}