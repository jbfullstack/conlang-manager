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
Tu es à la fois :
1) Linguiste expert en langue construite à primitives
2) Créateur de lexique poétique et culturel

But : À partir d'un **concept français** donné, proposer la **meilleure composition** (ordre significatif, répétitions autorisées) **uniquement avec les primitives disponibles**, pour exprimer le concept sous la forme d’un **phénomène culturel/naturel** ou d’une **image métaphorique canonique**. Éviter les juxtapositions plates (ex. "lumière rapide").

CONCEPT FRANÇAIS À EXPRIMER :
"${frenchInput}"

PRIMITIFS DISPONIBLES (ne pas réécrire les détails, n'utiliser que ceux listés) :
${concepts
  .map((c) => {
    const props = (c.conceptProperties ?? [])
      .map((cp) => cp?.property?.name)
      .filter(Boolean)
      .join(', ');
    return `- ${c.mot} = ${c.definition} (type: ${c.type}${props ? `, propriétés: ${props}` : ''})`;
  })
  .join('\n')}

### MÉTHODE OBLIGATOIRE
1. **Identifier la cible sémantique** du concept (phénomène naturel/culturel, archétype, image métaphorique concrète).
2. **Chercher une composition courte (2–4 items)** qui recrée ce phénomène/image. 
   - L’ordre est sémantique (cause→effet, support→qualité, source→trajectoire→cible).
   - Les répétitions sont autorisées si elles renforcent le sens (ex. intensité, rythme).
3. **Sélectionner la meilleure composition** selon cette métrique (dans cet ordre) :
   - (a) **Pertinence phénoménologique** : colle-t-elle à un phénomène universel connu ?
   - (b) **Couverture sémantique** : toutes les dimensions essentielles sont présentes (source, obstacle, résultat, etc.) ?
   - (c) **Parcimonie** : pas d’items superflus ; 2–3 items préférés si suffisant.
   - (d) **Canonicité culturelle** : image/événement reconnu (éclipse, reflet, aurore, foudre, mirage…).
4. **Vérifications avant réponse** :
   - Toutes les primitives de \`pattern\` **existent** dans la liste.
   - Aucune primitive inventée.
   - Si une primitive manque (ex. "lune", "ombre portée", "alignement"), l'ajouter dans \`missing_concepts\`.
   - Si aucune image/phénomène satisfaisant n’émerge, proposer **en repli** une composition descriptive minimale.
5. **Interdictions** :
   - Éviter les sorties de type "nom + adjectif" si un phénomène/image canonique existe.
   - Pas de texte hors JSON.

### EXEMPLES DE CARTOGRAPHIE (indicatifs)
- lumière + mouvement rapide → “étoile filante” (ordre source→trajectoire)
- soleil + obscurité → “éclipse” (obscurcissement du soleil)
- vent + sable → “tempête/sirocco”
- feu + ciel → “aurore” ou “éruption”
- eau + lumière → “reflet/miroir liquide” (support→effet)

### FORMAT DE RÉPONSE (JSON STRICT, UNIQUEMENT)
{
  "sens": "concept dominant (phénomène/image)",
  "confidence": 0.0,
  "justification": "raisonnement logique et poétique, concis (2–4 phrases)",
  "examples": ["exemple d'usage 1"],
  "alternatives": [
    {"sens": "sens alternatif 1", "confidence": 0.0},
    {"sens": "sens alternatif 2", "confidence": 0.0}
  ],
  "missing_concepts": ["nom_prochain_concept_si_manquant"],
  "pattern": ["primitive_1","primitive_2","primitive_3"],
  "source": "llm"
}

⚠️ RÉPONSE EN JSON STRICT UNIQUEMENT — AUCUN TEXTE EN DEHORS DU JSON
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
