
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// --- util commun
function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
}

// ⛔️ Ne plus auto-créer de user : on vérifie qu'il existe
async function requireUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ?? null;
}

// -------- GET /api/user/usage?userId=... --------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') ?? '';
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const user = await requireUser(userId);
    if (!user) {
      console.warn('[GET /user/usage] unknown_user:', userId);
      return NextResponse.json({ error: 'unknown_user', userId }, { status: 400 });
    }

    const { start, end } = dayBounds(new Date());

    // entrée du jour ?
    let daily = await prisma.dailyUsage.findFirst({
      where: { userId, date: { gte: start, lt: end } },
    });

    if (!daily) {
      // on initialise avec le "vrai" nombre de compositions du jour
      const realCount = await prisma.combination.count({
        where: { createdBy: userId, createdAt: { gte: start, lt: end } },
      });

      daily = await prisma.dailyUsage.create({
        data: {
          userId,
          date: start,
          compositionsCreated: realCount,
          aiSearchRequests: 0,
          aiAnalyzeRequests: 0,
          conceptsCreated: 0,
          estimatedCostUsd: 0,
        },
      });
    }

    return NextResponse.json(daily);
  } catch (e) {
    console.error('❌ Erreur API GET user/usage:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

// -------- POST /api/user/usage?userId=... --------
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') ?? '';
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const user = await requireUser(userId);
    if (!user) {
      console.warn('[POST /user/usage] unknown_user:', userId);
      return NextResponse.json({ error: 'unknown_user', userId }, { status: 400 });
    }

    const { increment } = await req.json().catch(() => ({} as any));
    const { start, end } = dayBounds(new Date());

    let daily = await prisma.dailyUsage.findFirst({
      where: { userId, date: { gte: start, lt: end } },
    });

    if (!daily) {
      const realCount = await prisma.combination.count({
        where: { createdBy: userId, createdAt: { gte: start, lt: end } },
      });
      daily = await prisma.dailyUsage.create({
        data: {
          userId,
          date: start,
          compositionsCreated: realCount,
          aiSearchRequests: 0,
          aiAnalyzeRequests: 0,
          conceptsCreated: 0,
          estimatedCostUsd: 0,
        },
      });
    }

    // Incréments
    const data: any = {};
    if (increment === 'compositions') data.compositionsCreated = daily.compositionsCreated + 1;
    if (increment === 'ai_search')   data.aiSearchRequests   = daily.aiSearchRequests + 1;
    if (increment === 'ai_analyze')  data.aiAnalyzeRequests  = daily.aiAnalyzeRequests + 1;

    if (Object.keys(data).length) {
      daily = await prisma.dailyUsage.update({ where: { id: daily.id }, data });
    }

    return NextResponse.json(daily);
  } catch (e) {
    console.error('❌ Erreur API POST user/usage:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}