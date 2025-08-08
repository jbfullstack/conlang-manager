import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { PrismaClient } from '@prisma/client';
import parseLLMJson, { buildLLMPromptRequest } from '@/lib/llm-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { frenchInput } = await request.json();
    
    // Récupérer tous les concepts
    const concepts = await prisma.concept.findMany({
      where: { isActive: true },
      include: {
        conceptProperties: {
          include: {
            property: true
          }
        }
      }
    });

    const prompt = `
Tu es un linguiste expert en langue construite basée sur des concepts primitifs.

RAPPORT: produire uniquement du JSON (strict) décrivant une ou plusieurs combinaisons possibles.

CONCEPT FRANÇAIS À EXPÉDUIR: "${frenchInput}"

PRIMITIFS DISPONIBLES (liste succincte, ne pas réécrire tout le détail) :
${concepts.map(c => `- ${c.id}: ${c.mot} (${c.type})`).join('\n')}

TÂCHE: proposer la meilleure composition (1 sens principal) qui exprime le concept français donné, en utilisant les primitives disponibles.

FORMAT DE RÉPONSE (JSON STRICT, uniquement ces champs):
{
  "sens": "texte décrivant le sens principal",
  "confidence": 0.0,
  "justification": "raisonnement succinct décrivant pourquoi ce sens est approprié",
  "examples": ["exemple d'usage 1", "exemple d'usage 2"],
  "pattern": ["concept_id_1","concept_id_2",...], // ordre correspond à la composition
  "missing_concepts": ["nom_prochain_concept_si_manquant"], // optionnel
  "proposed_new_primitives": [
    {"name": "nom_primaire", "definition": "définition courte", "type": "element | action | ...", "rationale": "pourquoi ajouter"}
  ],
  "source": "llm"
}
RÉPONSE EN JSON UNIQUEMENT
`;

    const response = await openai.chat.completions.create(buildLLMPromptRequest(prompt));
    const raw = response.choices?.[0]?.message?.content ?? '{}';
    const result = parseLLMJson(raw);
    return NextResponse.json({ ...result, source: 'llm' });
    
  } catch (error) {
    console.error('Erreur search-reverse:', error);
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 });
  }
}