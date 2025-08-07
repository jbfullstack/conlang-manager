import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { composition } = await request.json();
    
    // Récupérer tous les concepts avec leurs propriétés
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
COMPOSITION À ANALYSER: "${composition}"

CONCEPTS DISPONIBLES:
${allConceptsFromDB.map(c => `- "${c.mot}" = ${c.definition} (${c.type})`).join('\n')}

TÂCHE: Détermine le sens de cette composition dans notre langue construite.

RÉPONDS EN JSON:
{
  "sens": "sens déduit de la composition",
  "confidence": 0.65,
  "justification": "analyse des éléments de la composition", 
  "examples": ["usage possible"]
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
    console.error('Erreur analyze-composition:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}