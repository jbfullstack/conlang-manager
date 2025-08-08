import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { PrismaClient } from '@prisma/client';
import parseLLMJson, { buildLLMPromptRequest } from '@/lib/llm-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { composition } = await request.json();
    
    // Récupérer tous les concepts avec leurs propriétés
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
Tu es un linguiste expert en langue construite. Détermine le sens dominant d'une composition donnée à partir des primitives ci-dessous.

COMPOSITION À ANALYSER:
"${composition}"

PRIMITIFS DISPONIBLES:
${concepts.map(c => `- ${c.mot} = ${c.definition} (type: ${c.type})`).join('\n')}

RAPPORT: produire uniquement du JSON (strict) décrivant le sens principal et, si nécessaire, des alternatives.

FORMAT DE RÉPONSE (JSON STRICT, 0 ou 1 pour les champs numériques):
{
  "sens": "sens principal proposé",
  "confidence": 0.0,
  "justification": "raisonnement logique",
  "examples": ["exemple d'usage 1"],
  "alternatives": [
    {"sens": "sens alternatif 1", "confidence": 0.0},
    {"sens": "sens alternatif 2", "confidence": 0.0}
  ],
  "missing_concepts": ["nom_prochain_concept_si_manquant"],
  "source": "llm"
}
RÉPONSE EN JSON UNIQUEMENT
`;

    const response = await openai.chat.completions.create(buildLLMPromptRequest(prompt));

    const raw = response.choices?.[0]?.message?.content ?? '{}';
    const result = parseLLMJson(raw);
    return NextResponse.json({ ...result, source: 'llm' });
    
  } catch (error) {
    console.error('Erreur analyze-composition:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}