import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Récupérer les concepts avec leurs propriétés
export async function getConceptsFromDB(conceptIds: string[]) {
  return await prisma.concept.findMany({
    where: {
      id: { in: conceptIds },
      isActive: true
    },
    include: {
      conceptProperties: {
        include: {
          property: true
        }
      }
    }
  });
}

// Récupérer tous les concepts actifs
// export async function getAllConcepts() {
//   return await prisma.concept.findMany({
//     where: { isActive: true },
//     include: {
//       conceptProperties: {
//         include: {
//           property: true
//         }
//       }
//     },
//     orderBy: { mot: 'asc' }
//   });
// }

// Vérifier cache LLM existant
export async function checkLLMCache(cacheKey: string) {
  const cached = await prisma.lLMCache.findUnique({
    where: { 
      cacheKey: cacheKey,
      expiresAt: { gt: new Date() } // Pas expiré
    }
  });

  if (cached) {
    return {
      ...JSON.parse(cached.result),
      source: 'cache'
    };
  }
  return null;
}

// Sauvegarder résultat LLM en cache
export async function saveLLMToCache(
  cacheKey: string, 
  queryType: string,
  inputData: any, 
  result: any,
  tokensUsed?: number
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Cache 7 jours

  await prisma.lLMCache.create({
    data: {
      cacheKey,
      queryType,
      inputData: JSON.stringify(inputData),
      result: JSON.stringify(result),
      confidenceScore: result.confidence,
      tokensUsed,
      expiresAt
    }
  });
}

// Vérifier si une combinaison existe déjà
export async function checkExistingCombination(conceptIds: string[]) {
  const pattern = JSON.stringify(conceptIds.sort());
  
  return await prisma.combination.findFirst({
    where: {
      pattern: pattern,
      statut: { not: 'REFUSE' } // Exclure les refusés
    }
  });
}

// Sauvegarder une nouvelle combinaison
export async function saveCombination(
  conceptIds: string[],
  sens: string,
  source: 'MANUAL' | 'LLM_SUGGESTED' | 'ALGORITHMIC',
  confidenceScore: number,
  createdBy?: string
) {
  const pattern = JSON.stringify(conceptIds.sort());
  
  return await prisma.combination.create({
    data: {
      pattern,
      sens,
      source,
      confidenceScore,
      createdBy,
      statut: confidenceScore > 0.8 ? 'ADOPTE' : 'PROPOSITION'
    }
  });
}

// Transformer les concepts pour l'interface
export function transformConceptsForUI(concepts: any[]) {
  return concepts.map(concept => ({
    id: concept.id,
    mot: concept.mot,
    concept: concept.definition, // Votre "definition" = mon "concept"
    type: concept.type,
    proprietes: concept.conceptProperties.map((cp: any) => cp.property.name),
    couleur: getColorByType(concept.type) // À adapter selon vos types
  }));
}

// Couleurs par type (à adapter selon vos types)
function getColorByType(type: string): string {
  const colors = {
    'element': 'bg-blue-500',
    'action': 'bg-red-500', 
    'qualite': 'bg-green-500',
    'relation': 'bg-purple-500',
    'abstrait': 'bg-yellow-500'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-500';
}