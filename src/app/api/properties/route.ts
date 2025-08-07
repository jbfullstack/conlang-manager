import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeConcepts = searchParams.get('include') === 'concepts';
    const activeOnly = searchParams.get('active') !== 'false'; // Par défaut true pour compatibilité

    let where: any = {};

    // Pour l'autocomplétion (comportement existant), on filtre par isActive
    // Pour la page de gestion, on peut récupérer toutes les propriétés
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

    // Récupérer les propriétés avec ou sans les concepts associés
    const properties = await prisma.property.findMany({
      where,
      orderBy: [
        { isActive: 'desc' }, // Propriétés actives en premier
        { usageCount: 'desc' }, // Puis par usage
        { name: 'asc' } // Puis par nom alphabétique
      ],
      take: limit,
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

    // Récupérer les catégories uniques (toutes, pas seulement actives pour la gestion)
    const categoryWhere = activeOnly ? { isActive: true } : {};
    const categories = await prisma.property.findMany({
      where: categoryWhere,
      select: { category: true },
      distinct: ['category']
    });

    const uniqueCategories = categories
      .map(p => p.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ 
      properties,
      categories: uniqueCategories,
      total: properties.length
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