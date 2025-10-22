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
          include: { property: true },
        },
      },
    });

    const prompt = `
Tu es à la fois :
1. Linguiste expert en langue construite
2. Créateur de lexique poétique et culturel

Ta tâche : déterminer le **concept culturel, naturel ou mythopoétique dominant** d'une composition donnée à partir des primitives ci-dessous.

### MÉTHODE OBLIGATOIRE
1. **Analyser les primitives** : comprendre leur sens profond, leurs connotations, leurs usages.
2. **Chercher un lien culturel, naturel ou mythologique connu**, en priorité :
   - Phénomènes naturels (étoile filante, aurore, éclipse, mirage…)
   - Symboles ou archétypes universels (renaissance, passage, cycle, souffle, reflet…)
   - Événements perceptibles ou poétiques (danse de lumière, vent du désert…)
3. **Chercher un lien métaphorique ou poétique fort** :
   - Représentation imagée d’un phénomène du monde réel ou d’une émotion humaine.
4. **Seulement si rien n’émerge**, proposer un sens descriptif combiné ("eau lumineuse"), mais noter que c’est un **repli par défaut**, moins satisfaisant.
5. Choisir le sens le plus universel, symbolique et expressif.

### EXEMPLES DE RAISONNEMENT
- lumière + eau → "reflet" ou "miroir liquide"
- soleil + obscurité → "éclipse"
- vent + sable → "tempête" ou "sirocco"
- feu + ciel → "aurore" ou "éruption"
- lumière + mouvement → "étoile filante" ou "foudre"
- terre + souffle → "poussière", "brume", ou "respiration du monde"

### FORMAT ATTENDU
Réponds UNIQUEMENT en JSON strict :
{
  "sens": "concept dominant (culturel/naturel/métaphorique)",
  "confidence": 0.0,
  "justification": "raisonnement logique et poétique",
  "examples": ["exemple d'usage 1"],
  "alternatives": [
    {"sens": "sens alternatif 1", "confidence": 0.0},
    {"sens": "sens alternatif 2", "confidence": 0.0}
  ],
  "missing_concepts": ["nom_prochain_concept_si_manquant"],
  "pattern": ["concept_id_1","concept_id_2",...],
  "source": "llm"
}

COMPOSITION À ANALYSER :
"${composition}"

PRIMITIFS DISPONIBLES :
${concepts.map((c) => `- "${c.mot}" = ${c.definition} (type: ${c.type})`).join('\n')}

⚠️ RÉPONSE EN JSON STRICT UNIQUEMENT — AUCUN TEXTE EN DEHORS DU JSON
`;

    const response = await openai.chat.completions.create(buildLLMPromptRequest(prompt));
    const raw = response.choices?.[0]?.message?.content ?? '{}';
    const result = parseLLMJson(raw);

    // Enrichir patternWords si present
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
    console.error('Erreur analyse-composition:', error);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
