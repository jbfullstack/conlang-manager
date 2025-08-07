// ============================================
// prisma/seed.ts - Script de seed mis à jour
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed de la base de données...');

  // Nettoyer les données existantes (en développement uniquement)
  if (process.env.NODE_ENV === 'development') {
    await prisma.conceptProperty.deleteMany();
    await prisma.combinationVote.deleteMany();
    await prisma.combination.deleteMany();
    await prisma.concept.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Données existantes supprimées');
  }

  // Créer des utilisateurs de test
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@conlang.local',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        username: 'alice',
        email: 'alice@conlang.local', 
        passwordHash: hashedPassword,
        role: 'MEMBER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'bob',
        email: 'bob@conlang.local',
        passwordHash: hashedPassword,
        role: 'MEMBER',
      },
    }),
    prisma.user.create({
      data: {
        username: 'charlie',
        email: 'charlie@conlang.local',
        passwordHash: hashedPassword,
        role: 'MODERATOR',
      },
    }),
  ]);

  console.log('👥 Utilisateurs créés:', users.length);

  // Créer les propriétés de base
  const properties = await Promise.all([
    // Propriétés physiques
    prisma.property.create({
      data: {
        name: 'liquide',
        description: 'État liquide de la matière',
        category: 'physique',
      },
    }),
    prisma.property.create({
      data: {
        name: 'fluide',
        description: 'Qui coule facilement',
        category: 'physique',
      },
    }),
    prisma.property.create({
      data: {
        name: 'vital',
        description: 'Essentiel à la vie',
        category: 'abstrait',
      },
    }),
    prisma.property.create({
      data: {
        name: 'transparent',
        description: 'Laisse passer la lumière',
        category: 'visuel',
      },
    }),
    // Propriétés de mouvement
    prisma.property.create({
      data: {
        name: 'vitesse',
        description: 'Rapide, véloce',
        category: 'mouvement',
      },
    }),
    prisma.property.create({
      data: {
        name: 'dynamique',
        description: 'En mouvement, actif',
        category: 'mouvement',
      },
    }),
    prisma.property.create({
      data: {
        name: 'energie',
        description: 'Plein d\'énergie, puissant',
        category: 'abstrait',
      },
    }),
    // Propriétés lumineuses
    prisma.property.create({
      data: {
        name: 'lumiere',
        description: 'Émetteur ou porteur de lumière',
        category: 'visuel',
      },
    }),
    prisma.property.create({
      data: {
        name: 'chaleur',
        description: 'Chaud, réchauffant',
        category: 'sensoriel',
      },
    }),
    prisma.property.create({
      data: {
        name: 'vie',
        description: 'Porteur de vie, vivifiant',
        category: 'abstrait',
      },
    }),
    // Propriétés d'obscurité
    prisma.property.create({
      data: {
        name: 'obscurite',
        description: 'Sombre, sans lumière',
        category: 'visuel',
      },
    }),
    prisma.property.create({
      data: {
        name: 'repos',
        description: 'Calme, reposant',
        category: 'abstrait',
      },
    }),
    prisma.property.create({
      data: {
        name: 'mystere',
        description: 'Mystérieux, caché',
        category: 'abstrait',
      },
    }),
    prisma.property.create({
      data: {
        name: 'calme',
        description: 'Paisible, tranquille',
        category: 'emotion',
      },
    }),
    // Propriétés esthétiques
    prisma.property.create({
      data: {
        name: 'esthetique',
        description: 'Beau, agréable à regarder',
        category: 'visuel',
      },
    }),
    prisma.property.create({
      data: {
        name: 'harmonie',
        description: 'Équilibré, harmonieux',
        category: 'abstrait',
      },
    }),
    prisma.property.create({
      data: {
        name: 'equilibre',
        description: 'En équilibre, stable',
        category: 'abstrait',
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
        createdBy: users[0].id,
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
        createdBy: users[0].id,
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
        createdBy: users[1].id,
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
        createdBy: users[1].id,
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
        createdBy: users[2].id,
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

  // Mettre à jour le compteur d'usage des propriétés
  for (const property of properties) {
    const usageCount = await prisma.conceptProperty.count({
      where: { propertyId: property.id }
    });
    
    await prisma.property.update({
      where: { id: property.id },
      data: { usageCount }
    });
  }

  console.log('📊 Compteurs d\'usage mis à jour');

  // Créer des combinaisons de test (inchangé)
  const combinations = await Promise.all([
    prisma.combination.create({
      data: {
        pattern: JSON.stringify(['go', 'tomu']),
        sens: 'torrent, cascade, chute d\'eau rapide',
        description: 'Combinaison évidente : eau + mouvement rapide',
        statut: 'ADOPTE',
        confidenceScore: 0.95,
        source: 'MANUAL',
        createdBy: users[0].id,
        validatedAt: new Date(),
      },
    }),
    prisma.combination.create({
      data: {
        pattern: JSON.stringify(['sol', 'go']),
        sens: 'reflet du soleil sur l\'eau, miroitement',
        description: 'Image poétique du soleil se reflétant dans l\'eau',
        statut: 'EN_COURS',
        confidenceScore: 0.80,
        source: 'LLM_SUGGESTED',
        createdBy: users[1].id,
      },
    }),
    prisma.combination.create({
      data: {
        pattern: JSON.stringify(['nox', 'kala']),
        sens: 'beauté nocturne, splendeur de la nuit',
        description: 'La beauté particulière de la nuit étoilée',
        statut: 'PROPOSITION',
        confidenceScore: 0.75,
        source: 'MANUAL',
        createdBy: users[2].id,
      },
    }),
  ]);

  console.log('🔗 Combinaisons créées:', combinations.length);

  // Créer des votes de test
  const votes = await Promise.all([
    // Votes pour "go tomu" (adopté)
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[0].id,
        userId: users[1].id,
        vote: 'POUR',
        commentaire: 'Parfaitement logique et intuitif',
      },
    }),
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[0].id,
        userId: users[2].id,
        vote: 'POUR',
        commentaire: 'J\'approuve totalement',
      },
    }),
    // Votes pour "sol go" (en cours)  
    prisma.combinationVote.create({
      data: {
        combinationId: combinations[1].id,
        userId: users[0].id,
        vote: 'POUR',
        commentaire: 'Belle image poétique',
      },
    }),
  ]);

  console.log('🗳️  Votes créés:', votes.length);

  console.log('');
  console.log('✅ Seed terminé !');
  console.log('');
  console.log('📊 Résumé:');
  console.log(`   👥 Utilisateurs: ${users.length}`);
  console.log(`   🏷️  Propriétés: ${properties.length}`);
  console.log(`   💎 Concepts: ${concepts.length}`);
  console.log(`   🔗 Combinaisons: ${combinations.length}`);
  console.log(`   🗳️  Votes: ${votes.length}`);
  console.log('');
  console.log('👥 Comptes de test créés :');
  console.log('  admin@conlang.local / password123 (Admin)');  
  console.log('  alice@conlang.local / password123 (Member)');
  console.log('  bob@conlang.local / password123 (Member)');
  console.log('  charlie@conlang.local / password123 (Moderator)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });