import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import parseLLMJson, { buildLLMPromptRequest } from '@/lib/llm-utils';
import { prisma } from '@/lib/prisma';

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
      Tu es à la fois :
      1. Linguiste expert en langue construite
      2. Créateur de lexique poétique et culturel

      Ta tâche : déterminer le sens dominant d'une composition donnée à partir des primitives ci-dessous, 
      en appliquant STRICTEMENT la méthode suivante (dans cet ordre) :

      ### MÉTHODE OBLIGATOIRE
      1. **Analyser les primitives** : comprendre leur sens profond, leurs connotations, leurs usages.
      2. **Chercher un lien culturel ou naturel connu** : 
        - Phénomènes naturels (ex. éclipse, marée, mirage, reflet, halo, brume…)
        - Concepts universels (ex. naissance, mort, cycle, lumière, ombre…)
        - Objets/événements symboliques (ex. cérémonie, solstice, aurore…)
      3. **Chercher un lien métaphorique ou poétique** :
        - Images mentales, émotions, ambiances.
        - Références mythologiques, artistiques, philosophiques.
      4. **Seulement si aucune piste n’est pertinente**, proposer un sens descriptif direct ou combiné (ex. "eau lumineuse"), 
        mais noter que c’est un choix par défaut, moins pertinent.
      5. Choisir le sens le plus universel, expressif et culturellement riche.

      ### EXEMPLES D'INTERPRÉTATION ATTENDUS
      - Lumière + eau → "reflet" (pas "eau lumineuse")
      - Soleil + obscurité → "éclipse" (pas "soleil sombre")
      - Vent + sable → "tempête" ou "sirocco"
      - Feu + ciel → "aurore" ou "éruption"

      COMPOSITION À ANALYSER :
      "${composition}"

      PRIMITIFS DISPONIBLES :
      ${concepts.map((c) => `- "${c.mot}" = ${c.definition} (type: ${c.type})`).join('\n')}

      RAPPORT : produire uniquement du JSON strict décrivant le sens principal et, si nécessaire, des alternatives.

      FORMAT DE RÉPONSE (JSON STRICT) :
      {
        "sens": "sens principal proposé (culturel, naturel ou métaphorique si possible)",
        "confidence": 0.0,
        "justification": "raisonnement logique et sémantique",
        "examples": ["exemple d'usage 1"],
        "alternatives": [
          {"sens": "sens alternatif 1", "confidence": 0.0},
          {"sens": "sens alternatif 2", "confidence": 0.0}
        ],
        "missing_concepts": ["nom_prochain_concept_si_manquant"],
        "pattern": ["concept_id_1","concept_id_2",...],
        "source": "llm"
      }

      ⚠️ RÉPONSE EN JSON UNIQUEMENT — PAS DE TEXTE EN DEHORS DU JSON
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