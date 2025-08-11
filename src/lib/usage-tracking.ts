// lib/usage-tracking.ts
import { PrismaClient } from '@prisma/client';
import { FEATURE_FLAGS, Role } from './permissions';

const prisma = new PrismaClient();

export interface DailyUsageData {
  compositionsCreated: number;
  aiSearchRequests: number;
  aiAnalyzeRequests: number;
  conceptsCreated: number;
  estimatedCostUsd: number;
}

// Récupérer l'usage du jour pour un utilisateur
export async function getTodayUsage(userId: string): Promise<DailyUsageData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.dailyUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      }
    }
  });

  return {
    compositionsCreated: usage?.compositionsCreated ?? 0,
    aiSearchRequests: usage?.aiSearchRequests ?? 0,
    aiAnalyzeRequests: usage?.aiAnalyzeRequests ?? 0,
    conceptsCreated: usage?.conceptsCreated ?? 0,
    estimatedCostUsd: usage?.estimatedCostUsd ?? 0,
  };
}

// Incrémenter un compteur d'usage
export async function incrementUsage(
  userId: string, 
  type: keyof DailyUsageData, 
  amount: number = 1
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyUsage.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      }
    },
    create: {
      userId,
      date: today,
      [type]: amount,
    },
    update: {
      [type]: {
        increment: amount,
      },
    },
  });
}

// Vérifier si un utilisateur peut effectuer une action
export async function canPerformAction(
  userId: string, 
  userRole: Role, 
  actionType: keyof DailyUsageData
): Promise<{ allowed: boolean; message?: string; current?: number; limit?: number }> {
  const limits = FEATURE_FLAGS[userRole];
  
  // Si illimité (admin)
  const limitMap = {
    compositionsCreated: limits.maxCompositionsPerDay,
    aiSearchRequests: limits.maxAISearchPerDay,
    aiAnalyzeRequests: limits.maxAIAnalyzePerDay,
    conceptsCreated: limits.maxConceptsPerDay,
    estimatedCostUsd: limits.maxAIBudgetPerDay,
  };
  
  const limit = limitMap[actionType];
  if (limit === -1) {
    return { allowed: true };
  }

  const usage = await getTodayUsage(userId);
  const current = usage[actionType];

  if (current >= limit) {
    return {
      allowed: false,
      message: `Daily limit reached for ${actionType}`,
      current,
      limit,
    };
  }

  return { allowed: true, current, limit };
}

// Enregistrer une requête IA avec ses métriques
export async function logAIRequest(
  userId: string,
  requestType: 'AI_SEARCH' | 'AI_ANALYZE' | 'AI_SUGGESTION' | 'AI_TRANSLATION',
  inputData: any,
  outputData?: any,
  metrics?: {
    tokensUsed?: number;
    costUsd?: number;
    responseTime?: number;
    modelUsed?: string;
  },
  status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED' | 'INSUFFICIENT_CREDITS' = 'SUCCESS',
  errorMessage?: string
): Promise<void> {
  // Créer l'entrée AIRequest
  await prisma.aIRequest.create({
    data: {
      userId,
      requestType,
      inputData: JSON.stringify(inputData),
      outputData: outputData ? JSON.stringify(outputData) : null,
      tokensUsed: metrics?.tokensUsed,
      costUsd: metrics?.costUsd,
      responseTime: metrics?.responseTime,
      modelUsed: metrics?.modelUsed,
      status,
      errorMessage,
    },
  });

  // Incrémenter les compteurs si succès
  if (status === 'SUCCESS') {
    const usageType = requestType === 'AI_SEARCH' ? 'aiSearchRequests' : 'aiAnalyzeRequests';
    await incrementUsage(userId, usageType, 1);
    
    // Incrémenter le coût si disponible
    if (metrics?.costUsd) {
      await incrementUsage(userId, 'estimatedCostUsd', metrics.costUsd);
    }
  }
}

// Récupérer les statistiques d'usage pour admin
export async function getUsageStats(startDate?: Date, endDate?: Date) {
  const where: any = {};
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const stats = await prisma.dailyUsage.aggregate({
    where,
    _sum: {
      compositionsCreated: true,
      aiSearchRequests: true,
      aiAnalyzeRequests: true,
      conceptsCreated: true,
      estimatedCostUsd: true,
    },
    _avg: {
      compositionsCreated: true,
      aiSearchRequests: true,
      aiAnalyzeRequests: true,
      conceptsCreated: true,
      estimatedCostUsd: true,
    },
  });

  return stats;
}

// Récupérer les top utilisateurs par usage (pour admin)
export async function getTopUsers(limit: number = 10, orderBy: keyof DailyUsageData = 'estimatedCostUsd') {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      dailyUsage: {
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
          }
        },
        select: {
          compositionsCreated: true,
          aiSearchRequests: true,
          aiAnalyzeRequests: true,
          conceptsCreated: true,
          estimatedCostUsd: true,
        }
      }
    },
    take: limit,
  });

  // Calculer les totaux et trier
  const usersWithTotals = users.map(user => {
    const totals = user.dailyUsage.reduce((acc, day) => ({
      compositionsCreated: acc.compositionsCreated + day.compositionsCreated,
      aiSearchRequests: acc.aiSearchRequests + day.aiSearchRequests,
      aiAnalyzeRequests: acc.aiAnalyzeRequests + day.aiAnalyzeRequests,
      conceptsCreated: acc.conceptsCreated + day.conceptsCreated,
      estimatedCostUsd: acc.estimatedCostUsd + (day.estimatedCostUsd || 0),
    }), {
      compositionsCreated: 0,
      aiSearchRequests: 0,
      aiAnalyzeRequests: 0,
      conceptsCreated: 0,
      estimatedCostUsd: 0,
    });

    return {
      ...user,
      totals,
    };
  });

  return usersWithTotals.sort((a, b) => b.totals[orderBy] - a.totals[orderBy]);
}

// Nettoyer les anciennes données (à exécuter périodiquement)
export async function cleanupOldUsageData(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.dailyUsage.deleteMany({
    where: {
      date: {
        lt: cutoffDate,
      }
    }
  });

  return result.count;
}

// Helper pour vérifier si l'utilisateur premium est encore valide
export async function checkPremiumStatus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, premiumUntil: true }
  });

  if (!user) return false;
  if (user.role !== 'PREMIUM') return user.role === 'MODERATOR' || user.role === 'ADMIN';
  
  // Si premium, vérifier la date d'expiration
  if (user.premiumUntil && user.premiumUntil < new Date()) {
    // Rétrograder vers USER si expiré
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER', premiumUntil: null }
    });
    return false;
  }

  return true;
}