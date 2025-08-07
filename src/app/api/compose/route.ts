import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { conceptIds } = await request.json();
    
    // Récupérer les concepts demandés avec leurs propriétés
    const conceptsFromDB = await prisma.concept.findMany({
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

    // Transformer pour l'analyse
    const concepts = conceptsFromDB.map(c => ({
      id: c.id,
      mot: c.mot,
      concept: c.definition, // IMPORTANT: definition -> concept pour la logique
      type: c.type,
      proprietes: c.conceptProperties.map(cp => cp.property.name)
    }));

    // 1. RÈGLES ALGORITHMIQUES
    const algorithmicResult = applyCompositionRules(concepts);
    if (algorithmicResult && algorithmicResult.confidence >= 0.7) {
      return NextResponse.json(algorithmicResult);
    }

    // 2. APPEL LLM
    const prompt = `
Tu es un expert linguistique travaillant sur une langue construite basée sur des concepts primitifs.

CONCEPTS À COMBINER:
${concepts.map(c => `- "${c.mot}" = ${c.concept} (type: ${c.type}, propriétés: ${c.proprietes.join(', ')})`).join('\n')}

CONTEXTE: Cette langue fonctionne par composition logique. Les concepts s'assemblent selon des règles sémantiques naturelles.

EXEMPLES DE COMPOSITIONS RÉUSSIES:
- "go" (eau) + "tomu" (mouvement rapide) = "torrent/cascade"
- "solu" (lumière) + "vastè" (immensité) = "horizon lumineux/aube"

TÂCHE: Détermine le sens le plus probable de la combinaison ci-dessus.

RÉPONDS EN JSON UNIQUEMENT:
{
  "sens": "sens principal proposé",
  "confidence": 0.75,
  "justification": "explication logique basée sur les propriétés",
  "examples": ["exemple d'usage 1", "exemple d'usage 2"],
  "alternatives": [
    {"sens": "sens alternatif 1", "confidence": 0.6},
    {"sens": "sens alternatif 2", "confidence": 0.4}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json({ ...result, source: 'llm' });
    
  } catch (error) {
    console.error('Erreur compose:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}

// RÈGLES ALGORITHMIQUES
function applyCompositionRules(concepts: any[]) {
  const elements = concepts.filter(c => c.type === 'element');
  const actions = concepts.filter(c => c.type === 'action');
  
  if (elements.length === 1 && actions.length === 1) {
    const element = elements[0];
    const action = actions[0];
    
    // Cas spéciaux
    if (element.mot === 'go' && action.mot === 'tomu') {
      return {
        sens: 'torrent/cascade',
        confidence: 0.9,
        justification: 'Combinaison validée: eau + mouvement rapide = flux naturel',
        source: 'algorithmic',
        examples: ['Le torrent dévale la montagne']
      };
    }
    
    return {
      sens: `${element.concept} ${action.concept}`,
      confidence: 0.6,
      justification: `Règle: élément + action = processus`,
      source: 'algorithmic'
    };
  }
  
  return null;
}