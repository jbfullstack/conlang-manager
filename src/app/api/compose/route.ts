import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import parseLLMJson, { buildLLMPromptRequest } from '@/lib/llm-utils';
import { prisma } from '@/lib/prisma';

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('timeout'));
      }, ms);

    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch((e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const { conceptIds } = await request.json();
    
    // 🔍 DEBUG 1: Vérifier ce qui arrive du front-end
    console.log('🔍 conceptIds reçus:', conceptIds);
    
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

    // 🔍 DEBUG 2: Vérifier ce que retourne Prisma
    console.log('🔍 conceptsFromDB trouvés:', conceptsFromDB.length);
    console.log('🔍 Premier concept de DB:', conceptsFromDB[0]);

    // Transformer pour l'analyse
    const concepts = conceptsFromDB.map(c => ({
      id: c.id,
      mot: c.mot,
      concept: c.definition,
      type: c.type,
      proprietes: c.conceptProperties.map(cp => cp.property.name)
    }));

    // 🔍 DEBUG 3: Vérifier la transformation
    console.log('🔍 concepts transformés:', concepts);
    
    const prompt = `
    Tu es un linguiste expert en langue construite par composition de concepts primitifs.

    CONCEPTS SÉLECTIONNÉS (IDs et labels):
    ${concepts.map(c => `- ${c.id} : ${c.mot} (${c.type})`).join('\n')}

    OBJECTIF: produire la meilleure composition reliant ces concepts pour exprimer un sens donné.

    CONVENTIONS:
    - Pattern attendu: ["id1","id2",...]
    - Structure du sens: décrit par un champ "sens" et une justification
    - Si des règles algorithmiques simples permettent le résultat directement, privilégier l’algorithme; sinon déléguer à l’LLM
    - RÉSULTAT EN JSON UNIQUEMENT avec les champs:
      {
        "sens": "texte du sens dégagé",
        "confidence": 0.0,
        "justification": "raisonnement",
        "examples": ["exemple d’usage"],
        "alternatives": [
          {"sens": "sens alternatif", "confidence": 0.0}
        ],
        "source": "algorithmic" | "llm"
      }

    TÂCHE: retourne le JSON correspondant à la composition déterminée par les concepts fournis. Si une règle spécifique existe (par ex. go + tomu = torrent), applique-la et renseigne le champ source = "algorithmic".
    RÉPONSE EN JSON UNIQUEMENT
    `;

    console.log('compost POST prompt :', prompt);

    const response = await withTimeout(
      openai.chat.completions.create(buildLLMPromptRequest(prompt, 0.3, 500)),
      20000 // 20s timeout
    );

    const raw = response.choices?.[0]?.message?.content ?? '{}';
    const result = parseLLMJson(raw);

    console.log('compost POST result :', result);
    return NextResponse.json({ ...result, source: 'llm' });
    
  } catch (error: any) {
    console.error('Erreur compose:', error);

    // Timeout spécifique
    if (error?.message === 'timeout') {
      return NextResponse.json({
        sens: "Limite de temps IA",
        confidence: 0,
        justification: "L'appel IA n'a pas répondu dans les délais.",
        source: 'error',
        error_type: 'timeout'
      }, { status: 200 });
    }
    
    // GESTION SPÉCIFIQUE DES ERREURS OPENAI
    if (error?.status === 429) {
      return NextResponse.json({
        sens: "Limite de requêtes atteinte",
        confidence: 0,
        justification: "Trop de requêtes envoyées à l'IA. Réessayez dans quelques minutes.",
        source: 'error',
        error_type: 'rate_limit'
      }, { status: 200 }); // 200 pour que l'UI affiche le message
    }
    
    if (error?.status === 401) {
      return NextResponse.json({
        sens: "Erreur d'authentification IA",
        confidence: 0,
        justification: "Clé API OpenAI invalide ou expirée.",
        source: 'error',
        error_type: 'auth_error'
      }, { status: 200 });
    }
    
    if (error?.status === 402) {
      return NextResponse.json({
        sens: "Crédit IA épuisé",
        confidence: 0,
        justification: "Votre crédit OpenAI est épuisé. Veuillez recharger votre compte.",
        source: 'error',
        error_type: 'insufficient_quota'
      }, { status: 200 });
    }
    
    // Erreur générale
    return NextResponse.json({
      sens: "Erreur d'analyse",
      confidence: 0,
      justification: "Erreur technique lors de l'analyse. Réessayez plus tard.",
      source: 'error',
      error_type: 'general_error'
    }, { status: 200 });
  }
}

// RÈGLES ALGORITHMIQUES
// function applyCompositionRules(concepts: any[]) {
//   const elements = concepts.filter(c => c.type === 'element');
//   const actions = concepts.filter(c => c.type === 'action');
  
//   if (elements.length === 1 && actions.length === 1) {
//     const element = elements[0];
//     const action = actions[0];
    
//     // Cas spéciaux
//     if (element.mot === 'go' && action.mot === 'tomu') {
//       return {
//         sens: 'torrent/cascade',
//         confidence: 0.9,
//         justification: 'Combinaison validée: eau + mouvement rapide = flux naturel',
//         source: 'algorithmic',
//         examples: ['Le torrent dévale la montagne']
//       };
//     }
    
//     return {
//       sens: `${element.concept} ${action.concept}`,
//       confidence: 0.6,
//       justification: `Règle: élément + action = processus`,
//       source: 'algorithmic'
//     };
//   }
  
//   return null;
// }