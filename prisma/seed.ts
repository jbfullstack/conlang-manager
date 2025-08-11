// ============================================
// prisma/seed.ts - Script de seed mis à jour avec système de permissions
// ============================================

import { CATEGORY_KEYS } from '@/lib/categories';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed de la base de données avec système de permissions...');

  // Nettoyer les données existantes (en développement uniquement)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Nettoyage des données existantes...');
    await prisma.aIRequest.deleteMany();
    await prisma.dailyUsage.deleteMany();
    await prisma.conceptProperty.deleteMany();
    await prisma.combinationVote.deleteMany();
    await prisma.combinationStatusHistory.deleteMany();
    await prisma.combination.deleteMany();
    await prisma.concept.deleteMany();
    await prisma.property.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.lLMSuggestion.deleteMany();
    await prisma.lLMCache.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Données existantes supprimées');
  }

  // Créer des utilisateurs avec les nouveaux rôles
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@conlang.local',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    }),
    // Utilisateur de base
    prisma.user.create({
      data: {
        username: 'alice',
        email: 'alice@conlang.local', 
        passwordHash: hashedPassword,
        role: 'USER', // Nouveau nom pour MEMBER
      },
    }),
    // Utilisateur Premium
    prisma.user.create({
      data: {
        username: 'bob',
        email: 'bob@conlang.local',
        passwordHash: hashedPassword,
        role: 'PREMIUM',
        premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      },
    }),
    // Modérateur
    prisma.user.create({
      data: {
        username: 'charlie',
        email: 'charlie@conlang.local',
        passwordHash: hashedPassword,
        role: 'MODERATOR',
      },
    }),
    // Utilisateur Premium expiré (pour tester)
    prisma.user.create({
      data: {
        username: 'dave',
        email: 'dave@conlang.local',
        passwordHash: hashedPassword,
        role: 'PREMIUM',
        premiumUntil: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Expiré depuis 7 jours
      },
    }),
  ]);

  console.log('👥 Utilisateurs créés:', users.length);

  // Créer les propriétés de base (inchangé mais avec gestion d'erreur)
  const properties = await Promise.all([
    // Propriétés physiques
    prisma.property.create({
      data: {
        name: 'liquide',
        description: 'État liquide de la matière, qui coule facilement',
        category: 'PHYSIQUE',
      },
    }),
    prisma.property.create({
      data: {
        name: 'fluide',
        description: 'Qui coule facilement, se déplace avec fluidité',
        category: 'PHYSIQUE',
      },
    }),
    prisma.property.create({
      data: {
        name: 'transparent',
        description: 'Laisse passer la lumière, permet de voir au travers',
        category: 'VISUEL',
      },
    }),

    // Propriétés abstraites
    prisma.property.create({
      data: {
        name: 'vital',
        description: 'Essentiel à la vie, indispensable à l\'existence',
        category: 'ABSTRAIT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'energie',
        description: 'Plein d\'énergie, puissant, dynamique',
        category: 'ABSTRAIT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'repos',
        description: 'Calme, reposant, tranquille',
        category: 'ABSTRAIT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'mystere',
        description: 'Mystérieux, caché, énigmatique',
        category: 'ABSTRAIT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'harmonie',
        description: 'Équilibré, harmonieux, en accord',
        category: 'ABSTRAIT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'equilibre',
        description: 'En équilibre, stable, équilibré',
        category: 'ABSTRAIT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'vie',
        description: 'Porteur de vie, vivifiant, qui donne la vie',
        category: 'ABSTRAIT',
      },
    }),

    // Propriétés de mouvement
    prisma.property.create({
      data: {
        name: 'vitesse',
        description: 'Rapide, véloce, qui se déplace rapidement',
        category: 'MOUVEMENT',
      },
    }),
    prisma.property.create({
      data: {
        name: 'dynamique',
        description: 'En mouvement, actif, plein de dynamisme',
        category: 'MOUVEMENT',
      },
    }),

    // Propriétés visuelles/lumineuses
    prisma.property.create({
      data: {
        name: 'lumiere',
        description: 'Émetteur ou porteur de lumière, lumineux',
        category: 'VISUEL',
      },
    }),
    prisma.property.create({
      data: {
        name: 'obscurite',
        description: 'Sombre, sans lumière, dans l\'obscurité',
        category: 'VISUEL',
      },
    }),
    prisma.property.create({
      data: {
        name: 'esthetique',
        description: 'Beau, agréable à regarder, esthétiquement plaisant',
        category: 'VISUEL',
      },
    }),

    // Propriétés sensorielles
    prisma.property.create({
      data: {
        name: 'chaleur',
        description: 'Chaud, réchauffant, qui dégage de la chaleur',
        category: 'SENSORIEL',
      },
    }),

    // Propriétés émotionnelles
    prisma.property.create({
      data: {
        name: 'calme',
        description: 'Paisible, tranquille, qui apporte le calme',
        category: 'EMOTION',
      },
    }),
  ]);

  console.log('🏷️  Propriétés créées:', properties.length);

  // Créer un mapping pour faciliter la recherche
  const propMap = properties.reduce((acc, prop) => {
    acc[prop.name] = prop.id;
    return acc;
  }, {} as Record<string, string>);

  // Créer les concepts avec leurs propriétés liées
  const concepts = await Promise.all([
    // Concept "go" (eau)
    prisma.concept.create({
      data: {
        id: 'go',
        mot: 'go',
        definition: 'eau, élément liquide',
        type: 'element',
        exemples: JSON.stringify(['go tomu = cascade', 'go kala = eau pure']),
        usageFrequency: 0.85,
        createdBy: users[0].id, // admin
        conceptProperties: {
          create: [
            { propertyId: propMap['liquide'] },
            { propertyId: propMap['fluide'] },
            { propertyId: propMap['vital'] },
            { propertyId: propMap['transparent'] },
          ]
        }
      },
    }),
    // Concept "tomu" (mouvement rapide)
    prisma.concept.create({
      data: {
        id: 'tomu',
        mot: 'tomu', 
        definition: 'mouvement rapide, vitesse',
        type: 'action',
        exemples: JSON.stringify(['tomu sol = éclair', 'go tomu = torrent']),
        usageFrequency: 0.72,
        createdBy: users[2].id, // bob (premium)
        conceptProperties: {
          create: [
            { propertyId: propMap['vitesse'] },
            { propertyId: propMap['dynamique'] },
            { propertyId: propMap['energie'] },
          ]
        }
      },
    }),
    // Concept "sol" (soleil)
    prisma.concept.create({
      data: {
        id: 'sol',
        mot: 'sol',
        definition: 'soleil, lumière solaire, chaleur',
        type: 'element',
        exemples: JSON.stringify(['sol nox = crépuscule', 'sol kala = beauté dorée']),
        usageFrequency: 0.78,
        createdBy: users[1].id, // alice (user de base)
        conceptProperties: {
          create: [
            { propertyId: propMap['lumiere'] },
            { propertyId: propMap['chaleur'] },
            { propertyId: propMap['energie'] },
            { propertyId: propMap['vie'] },
          ]
        }
      },
    }),
    // Concept "nox" (nuit)
    prisma.concept.create({
      data: {
        id: 'nox',
        mot: 'nox',
        definition: 'obscurité, nuit, repos',
        type: 'element', 
        exemples: JSON.stringify(['nox kala = beauté nocturne', 'nox go = eau sombre']),
        usageFrequency: 0.65,
        createdBy: users[3].id, // charlie (moderator)
        conceptProperties: {
          create: [
            { propertyId: propMap['obscurite'] },
            { propertyId: propMap['repos'] },
            { propertyId: propMap['mystere'] },
            { propertyId: propMap['calme'] },
          ]
        }
      },
    }),
    // Concept "kala" (beauté)
    prisma.concept.create({
      data: {
        id: 'kala',
        mot: 'kala',
        definition: 'beauté, harmonie esthétique',
        type: 'propriete',
        exemples: JSON.stringify(['kala sol = beauté dorée', 'go kala = beauté liquide']),
        usageFrequency: 0.60,
        createdBy: users[2].id, // bob (premium)
        conceptProperties: {
          create: [
            { propertyId: propMap['esthetique'] },
            { propertyId: propMap['harmonie'] },
            { propertyId: propMap['equilibre'] },
          ]
        }
      },
    }),
  ]);

  console.log('💎 Concepts créés:', concepts.length);

  // Créer des combinaisons avec différents sources
  const combinations = await Promise.all([
    // Combinaison manuelle adoptée
    prisma.combination.create({
      data: {
        pattern: JSON.stringify(['go', 'tomu']),
        sens: 'torrent, cascade, chute d\'eau rapide',
        description: 'Combinaison évidente : eau + mouvement rapide',
        statut: 'ADOPTE',
        confidenceScore: 0.95,
        source: 'MANUAL',
        createdBy: users[0].id, // admin
        validatedBy: users[3].id, // validé par charlie (moderator)
        validatedAt: new Date(),
      },
    }),
    // Combinaison suggérée par IA (Premium user)
    prisma.combination.create({
      data: {
        pattern: JSON.stringify(['sol', 'go']),
        sens: 'reflet du soleil sur l\'eau, miroitement',
        description: 'Image poétique du soleil se reflétant dans l\'eau',
        statut: 'EN_COURS',
        confidenceScore: 0.80,
        source: 'LLM_SUGGESTED',
        createdBy: users[2].id, // bob (premium)
      },
    }),
    // Combinaison en attente de modération
    prisma.combination.create({
      data: {
        pattern: JSON.stringify(['nox', 'kala']),
        sens: 'beauté nocturne, splendeur de la nuit',
        description: 'La beauté particulière de la nuit étoilée',
        statut: 'PROPOSITION',
        confidenceScore: 0.75,
        source: 'MANUAL',
        createdBy: users[1].id, // alice (user de base)
      },
    }),
  ]);

  console.log('🔗 Combinaisons créées:', combinations.length);

  // Créer des données d'usage quotidien pour illustrer les limites
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dailyUsageData = await Promise.all([
    // Alice (USER) - proche de sa limite
    prisma.dailyUsage.create({
      data: {
        userId: users[1].id, // alice
        date: today,
        compositionsCreated: 4, // Sur 5 max
        aiSearchRequests: 0,
        aiAnalyzeRequests: 0,
        conceptsCreated: 1, // Sur 2 max
        estimatedCostUsd: 0,
      },
    }),
    // Bob (PREMIUM) - utilise les fonctionnalités IA
    prisma.dailyUsage.create({
      data: {
        userId: users[2].id, // bob
        date: today,
        compositionsCreated: 12,
        aiSearchRequests: 5, // Sur 20 max
        aiAnalyzeRequests: 3, // Sur 15 max
        conceptsCreated: 3,
        estimatedCostUsd: 0.45,
      },
    }),
    // Charlie (MODERATOR) - usage modéré
    prisma.dailyUsage.create({
      data: {
        userId: users[3].id, // charlie
        date: today,
        compositionsCreated: 8,
        aiSearchRequests: 12,
        aiAnalyzeRequests: 7,
        conceptsCreated: 5,
        estimatedCostUsd: 0.78,
      },
    }),
    // Données d'hier pour Bob
    prisma.dailyUsage.create({
      data: {
        userId: users[2].id, // bob
        date: yesterday,
        compositionsCreated: 8,
        aiSearchRequests: 15,
        aiAnalyzeRequests: 10,
        conceptsCreated: 2,
        estimatedCostUsd: 1.20,
      },
    }),
  ]);

  console.log('📊 Données d\'usage créées:', dailyUsageData.length);

  // Créer quelques requêtes IA dans l'historique
  const aiRequests = await Promise.all([
    // Requête IA réussie de Bob
    prisma.aIRequest.create({
      data: {
        userId: users[2].id, // bob
        requestType: 'AI_SEARCH',
        inputData: JSON.stringify({ query: 'eau qui coule rapidement' }),
        outputData: JSON.stringify({ 
          result: 'go tomu', 
          confidence: 0.85,
          explanation: 'Combinaison eau + vitesse' 
        }),
        tokensUsed: 150,
        costUsd: 0.003,
        responseTime: 1200,
        modelUsed: 'gpt-4o-mini',
        status: 'SUCCESS',
      },
    }),
    // Requête IA d'Alice bloquée (pas premium)
    prisma.aIRequest.create({
      data: {
        userId: users[1].id, // alice
        requestType: 'AI_SEARCH',
        inputData: JSON.stringify({ query: 'beauté de la nuit' }),
        status: 'INSUFFICIENT_CREDITS',
        errorMessage: 'Premium account required for AI features',
      },
    }),
    // Requête d'analyse de Charlie
    prisma.aIRequest.create({
      data: {
        userId: users[3].id, // charlie (moderator)
        requestType: 'AI_ANALYZE',
        inputData: JSON.stringify({ concepts: ['sol', 'kala'] }),
        outputData: JSON.stringify({ 
          analysis: 'Beauté dorée, splendeur solaire',
          confidence: 0.92 
        }),
        tokensUsed: 200,
        costUsd: 0.004,
        responseTime: 850,
        modelUsed: 'gpt-4o-mini',
        status: 'SUCCESS',
      },
    }),
  ]);

  console.log('🤖 Requêtes IA créées:', aiRequests.length);

  // Créer des votes sur les combinaisons
  const votes = await Promise.all([
    // Votes pour "go tomu" (adopté)
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[0].id,
        userId: users[1].id, // alice vote
        vote: 'POUR',
        commentaire: 'Parfaitement logique et intuitif',
      },
    }),
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[0].id,
        userId: users[2].id, // bob vote
        vote: 'POUR',
        commentaire: 'J\'approuve totalement',
      },
    }),
    // Vote pour "sol go"
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[1].id,
        userId: users[0].id, // admin vote
        vote: 'POUR',
        commentaire: 'Belle image poétique',
      },
    }),
    // Vote contre "nox kala" (pour illustrer)
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[2].id,
        userId: users[4].id, // dave vote contre
        vote: 'CONTRE',
        commentaire: 'Trop abstrait selon moi',
      },
    }),
  ]);

  console.log('🗳️  Votes créés:', votes.length);

  // Mettre à jour les compteurs d'usage des propriétés
  for (const property of properties) {
    const usageCount = await prisma.conceptProperty.count({
      where: { propertyId: property.id }
    });
    
    await prisma.property.update({
      where: { id: property.id },
      data: { usageCount }
    });
  }

  console.log('📊 Compteurs d\'usage des propriétés mis à jour');

  console.log('');
  console.log('✅ Seed terminé avec système de permissions !');
  console.log('');
  console.log('📊 Résumé:');
  console.log(`   👥 Utilisateurs: ${users.length}`);
  console.log(`   🏷️  Propriétés: ${properties.length}`);
  console.log(`   💎 Concepts: ${concepts.length}`);
  console.log(`   🔗 Combinaisons: ${combinations.length}`);
  console.log(`   📊 Données d'usage: ${dailyUsageData.length}`);
  console.log(`   🤖 Requêtes IA: ${aiRequests.length}`);
  console.log(`   🗳️  Votes: ${votes.length}`);
  console.log('');
  console.log('👥 Comptes de test créés :');
  console.log('  🔑 admin@conlang.local / password123 (ADMIN - Illimité)');  
  console.log('  👤 alice@conlang.local / password123 (USER - Limité, pas d\'IA)');
  console.log('  💎 bob@conlang.local / password123 (PREMIUM - IA activée)');
  console.log('  👮 charlie@conlang.local / password123 (MODERATOR - Outils de modération)');
  console.log('  💸 dave@conlang.local / password123 (PREMIUM expiré - Test expiration)');
  console.log('');
  console.log('📈 Limites de test configurées :');
  console.log('  USER: 5 compos/jour, 3 concepts max, pas d\'IA');
  console.log('  PREMIUM: 50 compos/jour, 6 concepts max, 20 recherches IA + 15 analyses');
  console.log('  MODERATOR: 100 compos/jour, 8 concepts max, 50 recherches IA + 40 analyses');
  console.log('  ADMIN: Illimité sur tout');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });