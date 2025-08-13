import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// GET - Récupérer une propriété spécifique
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        conceptProperties: {
          include: {
            concept: {
              select: {
                id: true,
                mot: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('Erreur lors de la récupération de la propriété:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de la propriété' },
      { status: 500 },
    );
  }
}

// PUT - Mettre à jour une propriété
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const { name, description, category, isActive } = body;

    // Validation
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Les champs nom, description et catégorie sont obligatoires' },
        { status: 400 },
      );
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Le nom doit contenir entre 2 et 50 caractères' },
        { status: 400 },
      );
    }

    if (description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { error: 'La description doit contenir entre 10 et 500 caractères' },
        { status: 400 },
      );
    }

    if (category.length < 2) {
      return NextResponse.json(
        { error: 'La catégorie doit contenir au moins 2 caractères' },
        { status: 400 },
      );
    }

    // Vérifier que la propriété existe
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    // Vérifier l'unicité du nom (sauf pour la propriété actuelle)
    if (name !== existingProperty.name) {
      const duplicateProperty = await prisma.property.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (duplicateProperty) {
        return NextResponse.json(
          { error: 'Une propriété avec ce nom existe déjà' },
          { status: 409 },
        );
      }
    }

    // Mettre à jour la propriété
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        category: category.toLowerCase().trim(),
        isActive: Boolean(isActive),
      },
      include: {
        conceptProperties: {
          include: {
            concept: {
              select: {
                id: true,
                mot: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Propriété mise à jour avec succès',
      property: updatedProperty,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la propriété:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la propriété' },
      { status: 500 },
    );
  }
}

// DELETE - Supprimer une propriété
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Vérifier que la propriété existe
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        conceptProperties: true,
      },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    // Vérifier si la propriété est utilisée par des concepts
    if (existingProperty.conceptProperties.length > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette propriété car elle est utilisée par ${existingProperty.conceptProperties.length} concept(s)`,
          usageCount: existingProperty.conceptProperties.length,
        },
        { status: 400 },
      );
    }

    // Supprimer la propriété
    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Propriété supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la propriété:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de la propriété' },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
