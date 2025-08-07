import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const concept = await prisma.concept.findUnique({
      where: { id },
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
      }
    });

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      concept: {
        ...concept,
        proprietes: concept.conceptProperties.map(cp => cp.property.name),
        propertiesDetails: concept.conceptProperties.map(cp => cp.property),
        exemples: concept.exemples ? JSON.parse(concept.exemples) : [],
        conceptProperties: undefined
      }
    });
  } catch (error) {
    console.error('Erreur GET concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { mot, definition, type, proprietes, etymologie, exemples, usageFrequency } = body;

    // Démarrer une transaction pour assurer la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // 1. Supprimer les anciennes relations de propriétés
      await tx.conceptProperty.deleteMany({
        where: { conceptId: id }
      });

      // 2. Traiter les nouvelles propriétés
      let newPropertyIds: string[] = [];
      
      if (proprietes && Array.isArray(proprietes)) {
        for (const propName of proprietes) {
          // Chercher si la propriété existe déjà
          let property = await tx.property.findUnique({
            where: { name: propName }
          });
          
          // Si elle n'existe pas, la créer
          if (!property) {
            property = await tx.property.create({
              data: {
                name: propName,
                category: '', // Catégorie par défaut pour les nouvelles propriétés
                usageCount: 0
              }
            });
          }
          
          newPropertyIds.push(property.id);
        }
      }

      // 3. Mettre à jour le concept avec les données de base
      const updatedConcept = await tx.concept.update({
        where: { id },
        data: {
          mot,
          definition,
          type,
          etymologie,
          exemples: JSON.stringify(exemples || []),
          usageFrequency: parseFloat(usageFrequency) || 0.5,
          version: { increment: 1 }
        }
      });

      // 4. Créer les nouvelles relations propriété-concept
      if (newPropertyIds.length > 0) {
        await tx.conceptProperty.createMany({
          data: newPropertyIds.map(propertyId => ({
            conceptId: id,
            propertyId
          }))
        });
      }

      // 5. Récupérer le concept complet avec ses relations
      const finalConcept = await tx.concept.findUnique({
        where: { id },
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
        }
      });

      return finalConcept;
    });

    // 6. Mettre à jour les compteurs d'usage des propriétés (en dehors de la transaction)
    if (result?.conceptProperties) {
      await updateAllPropertyUsageCounts();
    }

    // 7. Formater la réponse pour maintenir la compatibilité avec le frontend
    return NextResponse.json({
      concept: {
        ...result,
        proprietes: result?.conceptProperties.map(cp => cp.property.name) || [],
        propertiesDetails: result?.conceptProperties.map(cp => cp.property) || [],
        exemples: result?.exemples ? JSON.parse(result.exemples) : [],
        conceptProperties: undefined
      }
    });
  } catch (error) {
    console.error('Erreur PUT concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    
    await prisma.concept.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Concept supprimé' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonction utilitaire pour mettre à jour tous les compteurs d'usage
async function updateAllPropertyUsageCounts() {
  try {
    const properties = await prisma.property.findMany({
      select: { id: true }
    });
    
    for (const property of properties) {
      const usageCount = await prisma.conceptProperty.count({
        where: { propertyId: property.id }
      });
      
      await prisma.property.update({
        where: { id: property.id },
        data: { usageCount }
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour compteurs:', error);
  }
}