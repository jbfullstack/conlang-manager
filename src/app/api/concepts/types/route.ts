import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET - Récupérer tous les types de concepts disponibles
export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les types uniques dans la base de données
    const types = await prisma.concept.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: {
        type: 'asc'
      }
    });

    const uniqueTypes = types
      .map(c => c.type)
      .filter(Boolean) // Enlever les valeurs falsy
      .sort();

    // Optionnellement, récupérer aussi le nombre de concepts par type
    const typesWithCount = await Promise.all(
      uniqueTypes.map(async (type) => {
        const count = await prisma.concept.count({
          where: { type }
        });
        const activeCount = await prisma.concept.count({
          where: { type, isActive: true }
        });
        return { type, count, activeCount };
      })
    );

    return NextResponse.json({ 
      types: uniqueTypes,
      typesWithCount
    });
    
  } catch (error) {
    console.error('Erreur GET concept types:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des types de concepts' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}