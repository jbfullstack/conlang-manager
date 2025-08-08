import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { openai } from '@/lib/openai';
import parseLLMJson, { buildLLMPromptRequest } from '@/lib/llm-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { composition } = await request.json();

    // Récupérer concepts
    const concepts = await prisma.concept.findMany({
      where: { isActive: true },
      include: {
        conceptProperties: {
          include: { property: true }
        }
      }
    });

    const prompt = `
Tu es un linguiste expert en langue construite. Détermine le sens dominant d'une composition donnée à partir des primitives ci-dessous.

COMPOSITION À ANALYSER:
"${composition}"

PRIMITIFS DISPONIBLES:
${concepts.map((c) => `- "${c.mot}" = ${c.definition} (type: ${c.type})`).join('\n')}

RAPPORT: produire uniquement du JSON (strict) décrivant le sens principal et, si nécessaire, des alternatives.

FORMAT DE RÉPONSE (JSON STRICT):
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
  "pattern": ["concept_id_1","concept_id_2",...],
  "source": "llm"
}
RÉPONSE EN JSON UNIQUEMENT
`;

    const response = await openai.chat.completions.create(buildLLMPromptRequest(prompt));
    const raw = response.choices?.[0]?.message?.content ?? '{}';
    const result = parseLLMJson(raw);

    // Enrichir patternWords si present
    let patternMot: string[] = [];
    try {
      const idToMot: Record<string, string> = {};
      concepts.forEach((c: any) => { if (c?.id && c?.mot) idToMot[c.id] = c.mot; });
      const pat = (result as any).pattern ?? [];
      patternMot = pat.map((id: string) => idToMot[id] ?? id);
    } catch {
      patternMot = [];
    }

    return NextResponse.json({ ...result, patternMot, source: 'llm' });
  } catch (error) {
    console.error('Erreur analyse-composition:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}