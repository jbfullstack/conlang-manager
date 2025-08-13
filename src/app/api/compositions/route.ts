import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { pattern, sens, description, statut, source, confidenceScore } = await request.json();
    
    // Créer la nouvelle combination
    const combination = await prisma.combination.create({
      data: {
        pattern: JSON.stringify(pattern), // Array des IDs de concepts
        sens,
        description,
        statut,
        source,
        confidenceScore
        // createdBy: userId, // À ajouter quand vous aurez l'auth
      }
    });

    return NextResponse.json(combination, { status: 201 });
    
  } catch (error) {
    console.error('Erreur sauvegarde combination:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

// export async function GET() {
//   try {
//     const combinations = await prisma.combination.findMany({
//       where: { 
//         statut: { not: 'REFUSE' } // Exclure les refusées
//       },
//       orderBy: { createdAt: 'desc' },
//       take: 20 // Limiter à 20 résultats récents
//     });

//     return NextResponse.json(combinations);
    
//   } catch (error) {
//     console.error('Erreur récupération combinations:', error);
//     return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
//   }
// }

export async function GET(request: NextRequest) {
  try {
    console.log('📚 GET /api/compositions - Fetching compositions...');
    
    // Récupérer toutes les compositions avec les infos basiques
    const compositions = await prisma.combination.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limiter à 50 pour les perfs
      select: {
        id: true,
        pattern: true,
        sens: true,
        description: true,
        statut: true,
        source: true,
        confidenceScore: true,
        createdAt: true,
        createdBy: true,
        // Optionnel: Inclure le nom de l'utilisateur
        // createdByUser: {
        //   select: {
        //     username: true,
        //     role: true
        //   }
        // }
      }
    });

    // Parser les patterns JSON
    const formattedCompositions = compositions.map(comp => ({
      ...comp,
      pattern: JSON.parse(comp.pattern)
    }));

    console.log('✅ Found', compositions.length, 'compositions');
    
    return NextResponse.json(formattedCompositions);
    
  } catch (error) {
    console.error('❌ Error fetching compositions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compositions' }, 
      { status: 500 }
    );
  }
}
