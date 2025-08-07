import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer toutes les catégories disponibles
export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les catégories uniques dans la base de données
    const categories = await prisma.property.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: {
          not: null
        }
      },
      orderBy: {
        category: 'asc'
      }
    });

    const uniqueCategories = categories
      .map(p => p.category)
      .filter(Boolean) // Enlever les valeurs null/undefined
      .sort();

    // Optionnellement, récupérer aussi le nombre de propriétés par catégorie
    const categoriesWithCount = await Promise.all(
      uniqueCategories.map(async (category) => {
        const count = await prisma.property.count({
          where: { category }
        });
        return { category, count };
      })
    );

    return NextResponse.json({ 
      categories: uniqueCategories,
      categoriesWithCount
    });
    
  } catch (error) {
    console.error('Erreur GET categories:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des catégories' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}