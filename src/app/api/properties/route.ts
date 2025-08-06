import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 DEBUG: Récupération des propriétés...'); // Debug
    
    // Récupérer tous les concepts
    const concepts = await prisma.concept.findMany({
      where: { isActive: true },
      select: { proprietes: true }
    });
    
    console.log('🔍 DEBUG: Concepts trouvés:', concepts.length); // Debug
    
    // Extraire toutes les propriétés uniques
    const allProperties = new Set<string>();
    concepts.forEach((concept: { proprietes: string; }) => {
      if (concept.proprietes) {
        try {
          const props = JSON.parse(concept.proprietes) as string[];
          props.forEach(prop => {
            if (prop && prop.trim()) {
              allProperties.add(prop.trim().toLowerCase());
            }
          });
        } catch (e) {
          console.warn('Erreur parsing propriétés:', concept.proprietes);
        }
      }
    });
    
    // Convertir en tableau et trier
    const sortedProperties = Array.from(allProperties).sort();
    
    console.log('✅ DEBUG: Propriétés extraites:', sortedProperties); // Debug
    
    return NextResponse.json({
      properties: sortedProperties
    });
  } catch (error) {
    console.error('❌ Erreur GET properties:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}