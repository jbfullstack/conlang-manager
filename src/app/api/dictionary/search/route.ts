import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function str(v: string | null): string {
  return (v || '').trim();
}

// Normalise n'importe quelle forme (JSON, string, objet) en string[]
function normalizePattern(v: any): string[] {
  try {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String);

    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return [];
      if (s.startsWith('[')) return (JSON.parse(s) as any[]).map(String);
      return s
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    if (typeof v === 'object') {
      // @ts-ignore
      if (Array.isArray(v?.values)) return v.values.map(String);
      return Object.values(v).map(String);
    }
    return [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = str(searchParams.get('q'));
    const scopeRaw = (searchParams.get('scope') || 'all').toLowerCase();
    const scope: 'all' | 'concepts' | 'combinations' =
      scopeRaw === 'compositions'
        ? 'combinations'
        : scopeRaw === 'combinations'
        ? 'combinations'
        : scopeRaw === 'concepts'
        ? 'concepts'
        : 'all';

    const lang = (searchParams.get('lang') || 'all') as 'all' | 'conlang' | 'fr';
    const status = str(searchParams.get('status'));
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')));

    // Flags schéma (sécurisés)
    const USE_PATTERN_WORDS = process.env.USE_PATTERN_WORDS === 'true'; // combination.patternWords: string[]
    const USE_PATTERN_TEXT = process.env.USE_PATTERN_TEXT === 'true'; // combination.pattern: string LIKE
    const COMBO_TITLE_FIELD = (process.env.COMBINATION_TITLE_FIELD || '').trim(); // ex: headword | title

    const like = (s: string) => ({ contains: s, mode: 'insensitive' as const });

    const wantConcepts = scope === 'all' || scope === 'concepts';
    const wantCombinations = scope === 'all' || scope === 'combinations';

    // -------------------- CONCEPTS --------------------
    // FR -> (definition, type) ; Conlang -> (mot)
    // Conlang doit aussi retourner "go" quand on tape "eau" => OR (mot) ∪ (definition/type)
    const whereConcepts: any = { isActive: true };
    if (q) {
      if (lang === 'fr') {
        whereConcepts.OR = [{ definition: like(q) }, { type: like(q) }];
      } else if (lang === 'conlang') {
        whereConcepts.OR = [{ mot: like(q) }, { definition: like(q) }, { type: like(q) }];
      } else {
        // all = union FR ∪ Conlang
        whereConcepts.OR = [{ mot: like(q) }, { definition: like(q) }, { type: like(q) }];
      }
    }

    // -------------------- BRIDGE FR -> Conlang (pour combinations) --------------------
    // Si on est en lang=conlang (ou all), on peut dériver les "mots conlang" pertinents à partir des concepts FR.
    let bridgeConlangWords: string[] = [];
    if (q && wantCombinations && (lang === 'conlang' || lang === 'all') && USE_PATTERN_WORDS) {
      const frConcepts = await prisma.concept.findMany({
        where: {
          OR: [{ definition: like(q) }, { type: like(q) }],
          isActive: true,
        },
        select: { mot: true },
        take: 50,
      });
      bridgeConlangWords = frConcepts.map((c) => c.mot).filter(Boolean);
    }

    // -------------------- COMBINATIONS --------------------
    // FR = sens, description
    const frCombPreds = (qq: string) => [{ sens: like(qq) }, { description: like(qq) }];

    // Conlang = titre conlang (optionnel) + tokens conlang (patternWords) + fallback pattern LIKE (optionnel)
    const clCombPreds = (qq: string) => {
      const arr: any[] = [];
      if (COMBO_TITLE_FIELD) {
        const dyn: any = {};
        dyn[COMBO_TITLE_FIELD] = like(qq);
        arr.push(dyn);
      }
      if (USE_PATTERN_WORDS) {
        // recherche directe du token saisi (si l'user tape déjà un token conlang)
        arr.push({ patternWords: { has: qq } });
        // + bridge FR -> Conlang (si 'qq' est un mot FR, on ajoute les mots conlang dérivés)
        if (bridgeConlangWords.length) {
          arr.push({ patternWords: { hasSome: bridgeConlangWords } });
        }
      } else if (USE_PATTERN_TEXT) {
        // @ts-ignore si pattern est string
        arr.push({ pattern: like(qq) });
      }
      return arr;
    };

    const whereCombs: any = {};
    if (q) {
      const or =
        lang === 'fr'
          ? frCombPreds(q)
          : lang === 'conlang'
          ? clCombPreds(q)
          : [...frCombPreds(q), ...clCombPreds(q)]; // all = union
      if (or.length) whereCombs.OR = or;
    }
    if (status) whereCombs.statut = status;

    // -------------------- COUNT --------------------
    const [conceptsCount, combinationsCount] = await Promise.all([
      wantConcepts ? prisma.concept.count({ where: whereConcepts }) : Promise.resolve(0),
      wantCombinations ? prisma.combination.count({ where: whereCombs }) : Promise.resolve(0),
    ]);

    // -------------------- DATA --------------------
    const [concepts, combinationsRaw] = await Promise.all([
      wantConcepts
        ? prisma.concept.findMany({
            where: whereConcepts,
            orderBy: [{ mot: 'asc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: { id: true, mot: true, definition: true, type: true, isActive: true },
          })
        : Promise.resolve([] as any[]),

      wantCombinations
        ? prisma.combination.findMany({
            where: whereCombs,
            orderBy: [{ updatedAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              sens: true,
              description: true,
              statut: true,
              pattern: true, // JSON | string | ...
              // patternWords: true,  // n'activer que si le champ existe dans ton schéma
              ...(COMBO_TITLE_FIELD ? ({ [COMBO_TITLE_FIELD]: true } as any) : {}),
              updatedAt: true,
              source: true,
            },
          })
        : Promise.resolve([] as any[]),
    ]);

    // Normalise pattern -> string[]
    const combinations = (combinationsRaw as any[]).map((c) => ({
      ...c,
      pattern: normalizePattern(c.pattern),
    }));

    return NextResponse.json({
      counts: { concepts: conceptsCount, combinations: combinationsCount },
      page,
      pageSize,
      concepts,
      combinations,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'search failed' }, { status: 500 });
  }
}
