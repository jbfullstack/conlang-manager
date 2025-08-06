import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed de la base de données...');

  // Nettoyer les données existantes (en développement uniquement)
  if (process.env.NODE_ENV === 'development') {
    await prisma.combinationVote.deleteMany();
    await prisma.combination.deleteMany();
    await prisma.concept.deleteMany();
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

  // Créer des concepts de test
  const concepts = await Promise.all([
    prisma.concept.create({
      data: {
        id: 'go',
        mot: 'go',
        definition: 'eau, élément liquide',
        type: 'element',
        proprietes: JSON.stringify(['liquide', 'fluide', 'vital', 'transparent']),
        exemples: JSON.stringify(['go tomu = cascade', 'go kala = eau pure']),
        usageFrequency: 0.85,
        createdBy: users[0].id,
      },
    }),
    prisma.concept.create({
      data: {
        id: 'tomu',
        mot: 'tomu', 
        definition: 'mouvement rapide, vitesse',
        type: 'action',
        proprietes: JSON.stringify(['vitesse', 'dynamique', 'energie']),
        exemples: JSON.stringify(['tomu sol = éclair', 'go tomu = torrent']),
        usageFrequency: 0.72,
        createdBy: users[0].id,
      },
    }),
    prisma.concept.create({
      data: {
        id: 'sol',
        mot: 'sol',
        definition: 'soleil, lumière solaire, chaleur',
        type: 'element',
        proprietes: JSON.stringify(['lumiere', 'chaleur', 'energie', 'vie']),
        exemples: JSON.stringify(['sol nox = crépuscule', 'sol kala = beauté dorée']),
        usageFrequency: 0.78,
        createdBy: users[1].id,
      },
    }),
    prisma.concept.create({
      data: {
        id: 'nox',
        mot: 'nox',
        definition: 'obscurité, nuit, repos',
        type: 'element', 
        proprietes: JSON.stringify(['obscurite', 'repos', 'mystere', 'calme']),
        exemples: JSON.stringify(['nox kala = beauté nocturne', 'nox go = eau sombre']),
        usageFrequency: 0.65,
        createdBy: users[1].id,
      },
    }),
    prisma.concept.create({
      data: {
        id: 'kala',
        mot: 'kala',
        definition: 'beauté, harmonie esthétique',
        type: 'propriete',
        proprietes: JSON.stringify(['esthetique', 'harmonie', 'equilibre']),
        exemples: JSON.stringify(['kala sol = beauté dorée', 'go kala = beauté liquide']),
        usageFrequency: 0.60,
        createdBy: users[2].id,
      },
    }),
  ]);

  console.log('💎 Concepts créés:', concepts.length);

  // Créer des combinaisons de test
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

  console.log('');
  console.log('✅ Seed terminé !');
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