import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de recherche et filtrage
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // active/inactive/all
    const includeConcepts = searchParams.get('include') === 'concepts';
    
    // Paramètres de pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
    
    // Mode de compatibilité pour l'autocomplétion existante
    const activeOnly = searchParams.get('active') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '0');
    
    // Mode legacy (autocomplétion) - comportement existant
    if (limit > 0) {
      let where: any = {};
      
      if (activeOnly) {
        where.isActive = true;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (category && category !== 'all') {
        where.category = category;
      }

      const properties = await prisma.property.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { name: 'asc' }
        ],
        take: limit
      });

      const categories = await prisma.property.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category']
      });

      const uniqueCategories = categories
        .map(p => p.category)
        .filter(Boolean)
        .sort();

      return NextResponse.json({ 
        properties,
        categories: uniqueCategories
      });
    }

    // Nouveau mode paginé avec filtrage global
    let where: any = {};

    // Filtrage par statut
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    // Si status === 'all' ou null, pas de filtre sur isActive

    // Filtrage par recherche textuelle
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtrage par catégorie
    if (category && category !== 'all') {
      where.category = category;
    }

    // Compte total (pour la pagination)
    const totalCount = await prisma.property.count({ where });

    // Calcul de la pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Récupération des propriétés avec pagination
    const properties = await prisma.property.findMany({
      where,
      orderBy: [
        { isActive: 'desc' }, // Propriétés actives en premier
        { usageCount: 'desc' }, // Puis par usage
        { name: 'asc' } // Puis par nom alphabétique
      ],
      skip,
      take: pageSize,
      include: includeConcepts ? {
        conceptProperties: {
          include: {
            concept: {
              select: {
                id: true,
                mot: true,
                type: true,
                isActive: true
              }
            }
          }
        }
      } : undefined
    });

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
      properties,
      pagination,
      totalCount, // Pour compatibilité
    });
    
  } catch (error) {
    console.error('Erreur GET properties:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des propriétés' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, isActive = true, autoComplete = false } = body;

    // Validation de base
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Le nom de la propriété est requis' },
        { status: 400 }
      );
    }

    // Si c'est pour l'autocomplétion (comportement existant)
    if (autoComplete) {
      // Vérifier si la propriété existe déjà
      const existing = await prisma.property.findFirst({
        where: { 
          name: {
            equals: name.trim().toLowerCase(),
            mode: 'insensitive'
          }
        }
      });

      if (existing) {
        // Incrémenter le usage count si elle existe
        const updated = await prisma.property.update({
          where: { id: existing.id },
          data: { usageCount: { increment: 1 } }
        });
        return NextResponse.json({ property: updated });
      }

      // Créer la nouvelle propriété avec usage count 1
      const property = await prisma.property.create({
        data: {
          name: name.trim().toLowerCase(),
          description: description?.trim(),
          category: category?.trim() || 'custom',
          usageCount: 1,
          isActive: true
        }
      });

      return NextResponse.json({ property }, { status: 201 });
    }

    // Validation plus stricte pour la gestion manuelle des propriétés
    if (!description?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: 'Les champs nom, description et catégorie sont obligatoires' },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Le nom doit contenir entre 2 et 50 caractères' },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { error: 'La description doit contenir entre 10 et 500 caractères' },
        { status: 400 }
      );
    }

    if (category.length < 2) {
      return NextResponse.json(
        { error: 'La catégorie doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom
    const existingProperty = await prisma.property.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingProperty) {
      return NextResponse.json(
        { error: 'Une propriété avec ce nom existe déjà' },
        { status: 409 }
      );
    }

    // Créer la propriété pour la gestion manuelle
    const newProperty = await prisma.property.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        category: category.toLowerCase().trim(),
        isActive: Boolean(isActive),
        usageCount: 0 // Commence à 0, sera incrémenté lors de l'usage
      },
      include: {
        conceptProperties: {
          include: {
            concept: {
              select: {
                id: true,
                mot: true,
                type: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Propriété créée avec succès',
      property: newProperty
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST property:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la propriété' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}