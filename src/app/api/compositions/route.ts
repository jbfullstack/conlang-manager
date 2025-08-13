import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// ⬇️ helper: hash ordre-sensible du pattern (array de string)
function patternHash(pattern: string[]) {
  // JSON.stringify conserve l’ordre; on hash la représentation JSON
  return crypto.createHash('sha256').update(JSON.stringify(pattern)).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { pattern, sens, description, statut, source, confidenceScore } = await request.json();

    const hash = patternHash(pattern);

    const existing = await prisma.combination.findFirst({
      where: { patternHash: hash }, // ⚠️ champ patternHash à ajouter en DB (cf 1.2)
    });
    if (existing) {
      return NextResponse.json(
        { error: 'COMPOSITION_EXISTS', existing },
        { status: 409 }
      );
    }
    
    // Créer la nouvelle combination
    const combination = await prisma.combination.create({
      data: {
        pattern: JSON.stringify(pattern), 
        patternHash: hash,
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
