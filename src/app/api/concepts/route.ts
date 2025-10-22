import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = request.headers.get('x-space-id') || searchParams.get('spaceId') || '';
    if (!spaceId) return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });

    // Paramètres de recherche et filtrage
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    // Paramètres de pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));

    // Mode de compatibilité - si pas de paramètres de pagination, comportement existant
    if (!searchParams.has('page') && !searchParams.has('pageSize')) {
      // Comportement legacy pour les appels existants
      // let where: any = { isActive: true };
      let where: any = { spaceId, isActive: true };

      if (search) {
        const term = search.toLowerCase();
        where.OR = [
          { mot: { contains: term, mode: 'insensitive' } },
          { definition: { contains: term, mode: 'insensitive' } },
          {
            conceptProperties: {
              some: {
                property: {
                  name: { contains: term, mode: 'insensitive' },
                },
              },
            },
          },
        ];
      }

      if (type && type !== 'all') {
        where.type = type;
      }

      const concepts = await prisma.concept.findMany({
        where,
        orderBy: [{ usageFrequency: 'desc' }, { mot: 'asc' }],
        include: {
          user: {
            select: { username: true },
          },
          conceptProperties: {
            include: {
              property: {
                select: { name: true },
              },
            },
          },
        },
      });

      // Transformer pour compatibilité avec l'ancien format
      const conceptsWithProperties = concepts.map((concept) => ({
        ...concept,
        proprietes: concept.conceptProperties.map((cp) => cp.property.name),
        exemples: concept.exemples ? JSON.parse(concept.exemples) : [],
      }));

      return NextResponse.json({ concepts: conceptsWithProperties });
    }

    // Nouveau mode paginé avec filtrage global
    let where: any = { spaceId };

    // Par défaut, on n'affiche que les actifs
    if (typeof where.isActive === 'undefined') {
      where.isActive = true;
    }

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
                name: { contains: term, mode: 'insensitive' },
              },
            },
          },
        },
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
        { mot: 'asc' }, // Puis par ordre alphabétique
      ],
      skip,
      take: pageSize,
      include: {
        user: {
          select: { username: true },
        },
        conceptProperties: {
          include: {
            property: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Transformer pour compatibilité avec l'ancien format
    const conceptsWithProperties = concepts.map((concept) => ({
      ...concept,
      proprietes: concept.conceptProperties.map((cp) => cp.property.name),
      exemples: concept.exemples ? JSON.parse(concept.exemples) : [],
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
      endItem: Math.min(skip + pageSize, totalCount),
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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mot, definition, type, proprietes = [], etymologie, exemples = [] } = body;

    // Validation
    if (!mot || !definition || !type) {
      return NextResponse.json(
        { error: 'Les champs mot, définition et type sont obligatoires' },
        { status: 400 },
      );
    }

    if (mot.length < 2 || mot.length > 100) {
      return NextResponse.json(
        { error: 'Le mot doit contenir entre 2 et 100 caractères' },
        { status: 400 },
      );
    }

    if (definition.length < 2 || definition.length > 500) {
      return NextResponse.json(
        { error: 'La définition doit contenir entre 2 et 500 caractères' },
        { status: 400 },
      );
    }

    const spaceId =
      request.headers.get('x-space-id') || new URL(request.url).searchParams.get('spaceId') || '';
    if (!spaceId) return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });
    // unicité par mot DANS l’espace
    const exists = await prisma.concept.findFirst({
      where: { spaceId, mot: { equals: mot.trim(), mode: 'insensitive' } },
    });
    if (exists) return NextResponse.json({ error: 'CONCEPT_EXISTS' }, { status: 409 });

    // Créer le concept d'abord
    const newConcept = await prisma.concept.create({
      data: {
        spaceId,
        id: mot.trim(),
        mot: mot.trim(),
        definition: definition.trim(),
        type: type.trim(),
        etymologie: etymologie?.trim(),
        exemples: JSON.stringify(
          Array.isArray(exemples) ? exemples.filter((e: string) => e?.trim()) : [],
        ),
        isActive: true,
      },
    });

    // propriétés (création auto dans l’espace)
    for (const propName of proprietes) {
      const normalized = String(propName || '')
        .trim()
        .toLowerCase();
      if (!normalized) continue;

      let property = await prisma.property.findFirst({
        where: { spaceId, name: { equals: normalized, mode: 'insensitive' } },
      });
      if (!property) {
        property = await prisma.property.create({
          data: {
            spaceId,
            name: normalized,
            description: `Propriété auto: ${normalized}`,
            category: 'custom',
            usageCount: 0,
            isActive: true,
          },
        });
      } else {
        await prisma.property.update({
          where: { id: property.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      await prisma.conceptProperty.create({
        data: { conceptId: newConcept.id, propertyId: property.id },
      });
    }

    const conceptWithProps = await prisma.concept.findUnique({
      where: { id: newConcept.id },
      include: { conceptProperties: { include: { property: { select: { name: true } } } } },
    });

    return NextResponse.json(
      {
        message: 'Concept créé avec succès',
        concept: {
          ...conceptWithProps,
          proprietes: conceptWithProps?.conceptProperties.map((cp) => cp.property.name) || [],
          exemples: conceptWithProps?.exemples ? JSON.parse(conceptWithProps.exemples) : [],
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du concept' },
      { status: 500 },
    );
  } finally {
    // await prisma.$disconnect();
  }
}
