// prisma/seed.ts — version multi-espace (spaces + memberships + MADROLE)

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const patternHashFromArray = (pattern: string[]) =>
  createHash('sha256').update(JSON.stringify(pattern)).digest('hex');

async function main() {
  console.log('🌱 Seed DB (multi-spaces + MADROLE)…');

  // Nettoyage (dev uniquement)
  if (process.env.NODE_ENV === 'development') {
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
    await prisma.spaceMember.deleteMany();
    await prisma.space.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Tables vidées');
  }

  // Utilisateurs
  const password = await bcrypt.hash('password123', 12);

  const [admin, alice, bob, charlie, dave] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@conlang.local',
        passwordHash: password,
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        username: 'alice',
        email: 'alice@conlang.local',
        passwordHash: password,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'bob',
        email: 'bob@conlang.local',
        passwordHash: password,
        role: 'PREMIUM',
        premiumUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: 'charlie',
        email: 'charlie@conlang.local',
        passwordHash: password,
        role: 'MODERATOR',
      },
    }),
    prisma.user.create({
      data: {
        username: 'dave',
        email: 'dave@conlang.local',
        passwordHash: password,
        role: 'PREMIUM',
        premiumUntil: new Date(Date.now() - 7 * 24 * 3600 * 1000), // expiré
      },
    }),
  ]);

  console.log('👥 Users OK');

  // Espaces
  const global = await prisma.space.create({
    data: {
      name: 'Argo Global',
      slug: 'global',
      status: 'ACTIVE',
      createdBy: admin.id,
      description: 'Espace par défaut (migration / global)',
    },
  });

  const linguaDev = await prisma.space.create({
    data: {
      name: 'Lingua Dev',
      slug: 'lingua-dev',
      status: 'ACTIVE',
      createdBy: charlie.id,
      description: 'Espace de test / dev',
    },
  });

  // Memberships
  await prisma.spaceMember.createMany({
    data: [
      { spaceId: global.id, userId: admin.id, role: 'OWNER' },
      { spaceId: global.id, userId: alice.id, role: 'MEMBER' },
      { spaceId: global.id, userId: bob.id, role: 'MEMBER' },
      { spaceId: global.id, userId: charlie.id, role: 'MODERATOR' },

      { spaceId: linguaDev.id, userId: charlie.id, role: 'OWNER' },
      { spaceId: linguaDev.id, userId: admin.id, role: 'MODERATOR' },
      // ⭐ MadRole (hérite de moderator, easter-eggs UI)
      { spaceId: linguaDev.id, userId: bob.id, role: 'MADROLE' },
      { spaceId: linguaDev.id, userId: alice.id, role: 'MEMBER' },
    ],
  });

  console.log('🗂️ Spaces + Members OK');

  // Propriétés (dans GLOBAL)
  const properties = await Promise.all([
    // physiques
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'liquide',
        description: 'État liquide',
        category: 'PHYSIQUE',
      },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'fluide',
        description: 'Se déplace facilement',
        category: 'PHYSIQUE',
      },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'vital',
        description: 'Essentiel à la vie',
        category: 'PHYSIQUE',
      },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'transparent',
        description: 'Laisse passer la lumière',
        category: 'PHYSIQUE',
      },
    }),

    // mouvement/énergie
    prisma.property.create({
      data: { spaceId: global.id, name: 'vitesse', description: 'Rapide', category: 'DYNAMIQUE' },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'dynamique',
        description: 'Mouvement, action',
        category: 'DYNAMIQUE',
      },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'energie',
        description: 'Puissance, énergie',
        category: 'DYNAMIQUE',
      },
    }),

    // visuel / sensoriel
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'lumiere',
        description: 'Émet/porte la lumière',
        category: 'VISUEL',
      },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'esthetique',
        description: 'Beau, plaisant',
        category: 'VISUEL',
      },
    }),
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'chaleur',
        description: 'Chaud, réchauffant',
        category: 'SENSORIEL',
      },
    }),

    // émotion
    prisma.property.create({
      data: {
        spaceId: global.id,
        name: 'calme',
        description: 'Apaise, tranquillise',
        category: 'EMOTION',
      },
    }),
  ]);

  const propMap = properties.reduce<Record<string, string>>(
    (acc, p) => ((acc[p.name] = p.id), acc),
    {},
  );
  console.log('🏷️ Properties OK', properties.length);

  // Concepts (dans GLOBAL)
  const concepts = await Promise.all([
    prisma.concept.create({
      data: {
        spaceId: global.id,
        id: 'go',
        mot: 'go',
        definition: 'eau, élément liquide',
        type: 'element',
        exemples: JSON.stringify(['go tomu = cascade', 'go kala = eau pure']),
        usageFrequency: 0.85,
        createdBy: admin.id,
        conceptProperties: {
          create: [
            { propertyId: propMap['liquide'] },
            { propertyId: propMap['fluide'] },
            { propertyId: propMap['vital'] },
            { propertyId: propMap['transparent'] },
          ],
        },
      },
    }),
    prisma.concept.create({
      data: {
        spaceId: global.id,
        id: 'tomu',
        mot: 'tomu',
        definition: 'mouvement rapide, vitesse',
        type: 'action',
        exemples: JSON.stringify(['tomu sol = éclair', 'go tomu = torrent']),
        usageFrequency: 0.72,
        createdBy: bob.id,
        conceptProperties: {
          create: [
            { propertyId: propMap['vitesse'] },
            { propertyId: propMap['dynamique'] },
            { propertyId: propMap['energie'] },
          ],
        },
      },
    }),
    prisma.concept.create({
      data: {
        spaceId: global.id,
        id: 'sol',
        mot: 'sol',
        definition: 'soleil, lumière solaire, chaleur',
        type: 'element',
        exemples: JSON.stringify(['sol nox = crépuscule', 'sol kala = beauté dorée']),
        usageFrequency: 0.78,
        createdBy: alice.id,
        conceptProperties: {
          create: [
            { propertyId: propMap['lumiere'] },
            { propertyId: propMap['chaleur'] },
            { propertyId: propMap['energie'] },
          ],
        },
      },
    }),
  ]);
  console.log('💎 Concepts OK', concepts.length);

  // Combinaisons (dans GLOBAL)
  await Promise.all([
    prisma.combination.create({
      data: {
        spaceId: global.id,
        pattern: JSON.stringify(['go', 'tomu']),
        patternHash: patternHashFromArray(['go', 'tomu']),
        sens: "torrent, cascade, chute d'eau rapide",
        description: 'eau + mouvement rapide',
        statut: 'ADOPTE',
        confidenceScore: 0.95,
        source: 'MANUAL',
        createdBy: admin.id,
        validatedBy: charlie.id,
        validatedAt: new Date(),
      },
    }),
    prisma.combination.create({
      data: {
        spaceId: global.id,
        pattern: JSON.stringify(['sol', 'kala']),
        patternHash: patternHashFromArray(['sol', 'kala']),
        sens: 'beauté dorée',
        description: 'beauté + lumière solaire',
        statut: 'PROPOSITION',
        confidenceScore: 0.7,
        source: 'LLM_SUGGESTED',
        createdBy: bob.id,
      },
    }),
  ]);

  // (Optionnel) Données d’usage / AI requests de ton seed initial…
  // … ici tu peux reprendre tes blocs dailyUsage / aiRequests existants si besoin.

  console.log('✅ Seed terminé (multi-spaces + MADROLE)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
