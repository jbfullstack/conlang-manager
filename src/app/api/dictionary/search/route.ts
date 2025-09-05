import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

// ---- ID helpers: accepte UUID / ULID / CUID (Prisma) ----
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const CUID_LIKE_RE = /^c[a-z0-9]{8,}$/i;
const isLikelyId = (v?: string | null): v is string =>
  !!v && (UUID_RE.test(v) || ULID_RE.test(v) || CUID_LIKE_RE.test(v));

// ---- Type guard pour requireAuthDev ----
function hasUser(x: any): x is {
  user: { id: string; email: string; role: any; username: string };
  hasPermission: (p: any) => boolean;
  canModifyResource: (ownerId: string, editOwn: any, editAll: any) => boolean;
} {
  return x && typeof x === 'object' && x.user && typeof x.user.id === 'string';
}

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

// ---- Helpers robustes: tente avec spaceId; si le schéma n'a pas la colonne, fallback sans ----
async function countConceptsScoped(whereScoped: any) {
  try {
    return await prisma.concept.count({ where: whereScoped });
  } catch {
    const { spaceId, ...withoutSpace } = whereScoped || {};
    return await prisma.concept.count({ where: withoutSpace });
  }
}
async function listConceptsScoped(whereScoped: any, page: number, pageSize: number) {
  try {
    return await prisma.concept.findMany({
      where: whereScoped,
      orderBy: [{ mot: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, mot: true, definition: true, type: true, isActive: true },
    });
  } catch {
    const { spaceId, ...withoutSpace } = whereScoped || {};
    return await prisma.concept.findMany({
      where: withoutSpace,
      orderBy: [{ mot: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, mot: true, definition: true, type: true, isActive: true },
    });
  }
}
async function countCombsScoped(whereScoped: any) {
  try {
    return await prisma.combination.count({ where: whereScoped });
  } catch {
    const { spaceId, ...withoutSpace } = whereScoped || {};
    return await prisma.combination.count({ where: withoutSpace });
  }
}
async function listCombsScoped(whereScoped: any, page: number, pageSize: number) {
  try {
    return await prisma.combination.findMany({
      where: whereScoped,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        sens: true,
        description: true,
        statut: true,
        pattern: true, // si la colonne n'existe pas, on retombe dans le catch
        updatedAt: true,
        source: true,
      },
    });
  } catch {
    const { spaceId, ...withoutSpace } = whereScoped || {};
    // Fallback sans 'pattern' si la colonne n'existe pas
    return await prisma.combination.findMany({
      where: withoutSpace,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        sens: true,
        description: true,
        statut: true,
        updatedAt: true,
        source: true,
      },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1) Auth (dev). Si requireAuthDev renvoie une NextResponse (401/redirect), retourne-la.
    const auth = await requireAuthDev(req);
    if (!hasUser(auth)) return auth as NextResponse;
    const { user } = auth;

    // 2) Résolution spaceId
    const url = new URL(req.url);
    const rawSid = req.headers.get('x-space-id') || url.searchParams.get('spaceId') || '';
    let spaceId: string | null = isLikelyId(rawSid) ? rawSid : null;

    // Fallback: 1er espace actif du user (depuis la DB) — NE PAS re-valider ici
    if (!spaceId) {
      const m = await prisma.spaceMember.findFirst({
        where: { userId: user.id, isActive: true },
        select: { spaceId: true },
        orderBy: { createdAt: 'asc' },
      });
      if (m?.spaceId) spaceId = m.spaceId; // on fait confiance à la DB
    }
    if (!spaceId) {
      return NextResponse.json({ error: 'SPACE_REQUIRED' }, { status: 400 });
    }

    // 3) Vérif appartenance : si le user n’est pas membre de cet espace → 403
    const isMember = await prisma.spaceMember.findFirst({
      where: { userId: user.id, spaceId, isActive: true },
      select: { id: true },
    });
    if (!isMember) {
      return NextResponse.json({ error: 'FORBIDDEN_SPACE' }, { status: 403 });
    }

    // 4) Params
    const q = str(url.searchParams.get('q'));
    const rawScope = (url.searchParams.get('scope') || 'all').toLowerCase();
    const scope: 'all' | 'concepts' | 'combinations' =
      rawScope === 'compositions'
        ? 'combinations'
        : rawScope === 'combinations'
        ? 'combinations'
        : rawScope === 'concepts'
        ? 'concepts'
        : 'all';

    const lang = (url.searchParams.get('lang') || 'all') as 'all' | 'conlang' | 'fr';
    const status = str(url.searchParams.get('status'));
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));

    const wantConcepts = scope === 'all' || scope === 'concepts';
    const wantCombinations = scope === 'all' || scope === 'combinations';
    const like = (s: string) => ({ contains: s, mode: 'insensitive' as const });

    // 5) WHEREs scopés (avec `spaceId`) — helpers gèreront le fallback si colonne absente
    const whereConcepts: any = { isActive: true, spaceId };
    if (q) {
      if (lang === 'fr') {
        whereConcepts.OR = [{ definition: like(q) }, { type: like(q) }];
      } else if (lang === 'conlang') {
        whereConcepts.OR = [{ mot: like(q) }, { definition: like(q) }, { type: like(q) }];
      } else {
        whereConcepts.OR = [{ mot: like(q) }, { definition: like(q) }, { type: like(q) }];
      }
    }

    const whereCombs: any = { spaceId };
    if (q) {
      const orFR = [{ sens: like(q) }, { description: like(q) }];
      // Pas de champs exotiques (patternWords, titre dynamique). On reste sur sens/description.
      const or =
        lang === 'fr'
          ? orFR
          : lang === 'conlang'
          ? orFR /* + { pattern: like(q) } si tu veux activer la recherche sur 'pattern' */
          : orFR;
      if (or.length) whereCombs.OR = or;
    }
    if (status) whereCombs.statut = status;

    // 6) Counts + Data (avec fallback auto si colonne spaceId inexistante)
    const [conceptsCount, combinationsCount] = await Promise.all([
      wantConcepts ? countConceptsScoped(whereConcepts) : Promise.resolve(0),
      wantCombinations ? countCombsScoped(whereCombs) : Promise.resolve(0),
    ]);

    const [concepts, combsRaw] = await Promise.all([
      wantConcepts ? listConceptsScoped(whereConcepts, page, pageSize) : Promise.resolve([]),
      wantCombinations ? listCombsScoped(whereCombs, page, pageSize) : Promise.resolve([]),
    ]);

    const combinations = (combsRaw as any[]).map((c) => ({
      ...c,
      pattern: normalizePattern((c as any).pattern),
    }));

    return NextResponse.json({
      counts: { concepts: conceptsCount, combinations: combinationsCount },
      page,
      pageSize,
      concepts,
      combinations,
    });
  } catch (e: any) {
    console.error('[dictionary/search] error:', e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || 'search failed' }, { status: 500 });
  }
}
