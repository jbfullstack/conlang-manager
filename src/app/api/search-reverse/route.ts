import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import parseLLMJson, { buildLLMPromptRequest } from '@/lib/llm-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { frenchInput } = await request.json();
    const spaceId = request.headers.get('x-space-id');
    if (!spaceId) return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });

    // Récupérer tous les concepts actifs
    const concepts = await prisma.concept.findMany({
      where: { spaceId, isActive: true },
      include: {
        conceptProperties: {
          include: { property: true },
        },
      },
    });

    // Prompt optimisé: liste des primitives avec leurs propriétés utilisées (limitées)
    const prompt = `
        Tu es un linguiste expert en langue construite basée sur des concepts primitifs.

        CONCEPT FRANÇAIS À EXPÉDUIR: "${frenchInput}"

        PRIMITIFS DISPONIBLES (liste succincte, ne pas réécrire tout le détail) :
        ${concepts
          .map((c) => {
            const props = (c.conceptProperties ?? [])
              .map((cp: any) => cp.property?.name)
              .filter(Boolean)
              .join(', ');
            return `- "${c.mot}" = ${c.definition} (type: ${c.type}${
              props ? `, propriétés: ${props}` : ''
            })`;
          })
          .join('\n')}

        Tâche: proposer la meilleure composition (1 sens principal) qui exprime le concept français donné, en utilisant les primitives disponibles.

        FORMAT DE RÉPONSE (JSON STRICT, UNIQUEMENT):
        {
          "sens": "sens principal",
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

    // Enrichir pattern avec les noms des primitives (UX)
    let patternMot: string[] = [];
    try {
      const idToMot: Record<string, string> = {};
      concepts.forEach((c: any) => {
        if (c?.id && c?.mot) idToMot[c.id] = c.mot;
      });
      const pat = (result as any).pattern ?? [];
      patternMot = pat.map((id: string) => idToMot[id] ?? id);
    } catch {
      patternMot = [];
    }

    return NextResponse.json({ ...result, patternMot, source: 'llm' });
  } catch (error) {
    console.error('Erreur search-reverse:', error);
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 });
  }
}
