import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { frenchInput } = await request.json();
    
    // Récupérer tous les concepts
    const allConceptsFromDB = await prisma.concept.findMany({
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
Tu es un expert linguistique. Tu dois trouver comment exprimer un concept français avec une langue construite.

CONCEPT À EXPRIMER EN FRANÇAIS: "${frenchInput}"

CONCEPTS PRIMITIFS DISPONIBLES:
${allConceptsFromDB.map(c => `- "${c.mot}" = ${c.definition} (${c.type})`).join('\n')}

EXEMPLES DE COMPOSITIONS RÉUSSIES:
- "torrent" → "go" (eau) + "tomu" (mouvement rapide)
- "horizon lumineux" → "solu" (lumière) + "vastè" (immensité)

TÂCHE: Trouve la meilleure composition pour exprimer "${frenchInput}".

RÉPONDS EN JSON:
{
  "sens": "Proposition: go + tomu pour 'torrent'",
  "confidence": 0.8,
  "justification": "Eau + mouvement = flux naturel correspondant au concept",
  "examples": ["go tomu = torrent qui dévale"],
  "missing_concepts": ["concept manquant si nécessaire"],
  "alternatives": [
    {"sens": "alternative 1", "confidence": 0.6}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 400
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json({ ...result, source: 'llm' });
    
  } catch (error) {
    console.error('Erreur search-reverse:', error);
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 });
  }
}