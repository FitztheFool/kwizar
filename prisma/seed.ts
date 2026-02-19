// prisma/seed.ts
import { PrismaClient, QuestionType, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed (version + intéressante)...');

  // Nettoyage (ordre important)
  await prisma.score.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Base nettoyée');

  // Utilisateurs
  const passwordHash = await hash('password123', 10);

  const [admin, alice, bob, charlie] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash,
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        username: 'alice',
        email: 'alice@example.com',
        passwordHash,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        username: 'bob',
        email: 'bob@example.com',
        passwordHash,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        username: 'charlie',
        email: 'charlie@example.com',
        passwordHash,
        role: Role.USER,
      },
    }),
  ]);

  console.log('✅ Utilisateurs créés (admin/alice/bob/charlie)');

  // Helper pour éviter de recopier
  const q = (data: any) => data;

  // QUIZ 1 — Culture Pop & Internet
  const quizPop = await prisma.quiz.create({
    data: {
      title: 'Culture Pop & Internet (niveau mixte)',
      description: 'Memes, séries, actus web… pas si simple 👀',
      creatorId: alice.id,
      isPublic: true,
      randomizeQuestions: true,
      questions: {
        create: [
          q({
            type: QuestionType.TRUE_FALSE,
            content: 'Le terme “meme” a été popularisé avant Internet.',
            points: 2,
            answers: { create: [{ content: 'Vrai', isCorrect: true }, { content: 'Faux', isCorrect: false }] },
          }),
          q({
            type: QuestionType.MCQ,
            content: 'Lesquels sont des formats de fichiers image ?',
            points: 3,
            answers: {
              create: [
                { content: 'PNG', isCorrect: true },
                { content: 'JPG/JPEG', isCorrect: true },
                { content: 'MP3', isCorrect: false },
                { content: 'WEBP', isCorrect: true },
              ],
            },
          }),
          q({
            type: QuestionType.TEXT,
            content: 'Dans “Stranger Things”, comment s’appelle le monde parallèle ? (un seul mot)',
            points: 5,
            answers: {
              // Si ton correcteur TEXT est strict, garde une seule bonne réponse.
              // Si tu gères les synonymes/casse, tu peux en ajouter (UpideDown, etc.).
              create: [{ content: 'UpsideDown', isCorrect: true }],
            },
          }),
          q({
            type: QuestionType.MULTI_TEXT,
            content: 'Cite 3 plateformes de streaming (ordre libre).',
            points: 6,
            strictOrder: false,
            answers: {
              create: [
                { content: 'Netflix', isCorrect: true },
                { content: 'Disney+', isCorrect: true },
                { content: 'Prime Video', isCorrect: true },
                // options “bonus” acceptées si ton scoring MULTI_TEXT le permet
                { content: 'Max', isCorrect: true },
                { content: 'Apple TV+', isCorrect: true },
              ],
            },
          }),
        ],
      },
    },
  });

  // QUIZ 2 — JavaScript / TypeScript (pièges classiques)
  const quizJS = await prisma.quiz.create({
    data: {
      title: 'JavaScript / TypeScript — pièges classiques',
      description: 'Closures, types, runtime… attention aux détails.',
      creatorId: bob.id,
      isPublic: true,
      randomizeQuestions: true,
      questions: {
        create: [
          q({
            type: QuestionType.TRUE_FALSE,
            content: 'En JavaScript, typeof null retourne "null".',
            points: 2,
            answers: { create: [{ content: 'Vrai', isCorrect: false }, { content: 'Faux', isCorrect: true }] },
          }),
          q({
            type: QuestionType.MCQ,
            content: 'Lesquels sont des types primitifs en JavaScript ?',
            points: 3,
            answers: {
              create: [
                { content: 'string', isCorrect: true },
                { content: 'number', isCorrect: true },
                { content: 'object', isCorrect: false },
                { content: 'bigint', isCorrect: true },
              ],
            },
          }),
          q({
            type: QuestionType.TEXT,
            content: 'Quelle méthode transforme un JSON string en objet ? (réponse: une fonction)',
            points: 5,
            answers: { create: [{ content: 'JSON.parse', isCorrect: true }] },
          }),
          q({
            type: QuestionType.MULTI_TEXT,
            content: 'Donne les 3 premières valeurs renvoyées par: [1,2,3].map(x => x*2) (ordre strict).',
            points: 9,
            strictOrder: true,
            answers: {
              create: [
                { content: '2', isCorrect: true },
                { content: '4', isCorrect: true },
                { content: '6', isCorrect: true },
              ],
            },
          }),
        ],
      },
    },
  });

  // QUIZ 3 — France / Paris (plus “local”)
  const quizFrance = await prisma.quiz.create({
    data: {
      title: 'France & Paris — détails qui font mal',
      description: 'Géographie, histoire, institutions…',
      creatorId: charlie.id,
      isPublic: true,
      questions: {
        create: [
          q({
            type: QuestionType.TRUE_FALSE,
            content: 'Le Mont-Saint-Michel est en Normandie.',
            points: 2,
            answers: { create: [{ content: 'Vrai', isCorrect: true }, { content: 'Faux', isCorrect: false }] },
          }),
          q({
            type: QuestionType.MCQ,
            content: 'Lesquelles sont des villes françaises ?',
            points: 3,
            answers: {
              create: [
                { content: 'Lyon', isCorrect: true },
                { content: 'Bruxelles', isCorrect: false },
                { content: 'Nantes', isCorrect: true },
                { content: 'Genève', isCorrect: false },
              ],
            },
          }),
          q({
            type: QuestionType.TEXT,
            content: 'Quel fleuve traverse Paris ? (un seul mot)',
            points: 5,
            answers: { create: [{ content: 'Seine', isCorrect: true }] },
          }),
          q({
            type: QuestionType.MULTI_TEXT,
            content: 'Cite 3 régions françaises (ordre libre).',
            points: 6,
            strictOrder: false,
            answers: {
              create: [
                { content: 'Île-de-France', isCorrect: true },
                { content: 'Bretagne', isCorrect: true },
                { content: 'Occitanie', isCorrect: true },
                { content: 'Normandie', isCorrect: true },
                { content: 'Grand Est', isCorrect: true },
              ],
            },
          }),
        ],
      },
    },
  });

  // QUIZ 4 — Mythologie (privé, “admin only” dans l’idée)
  const quizMytho = await prisma.quiz.create({
    data: {
      title: 'Mythologie',
      description: 'Un quiz privé pour tester les cracks.',
      creatorId: admin.id,
      isPublic: true, // privé
      randomizeQuestions: true,
      questions: {
        create: [
          q({
            type: QuestionType.TRUE_FALSE,
            content: 'Héraclès est un dieu olympien de naissance.',
            points: 2,
            answers: { create: [{ content: 'Vrai', isCorrect: false }, { content: 'Faux', isCorrect: true }] },
          }),
          q({
            type: QuestionType.MCQ,
            content: 'Qui sont des divinités nordiques ?',
            points: 3,
            answers: {
              create: [
                { content: 'Odin', isCorrect: true },
                { content: 'Loki', isCorrect: true },
                { content: 'Hadès', isCorrect: false },
                { content: 'Thor', isCorrect: true },
              ],
            },
          }),
          q({
            type: QuestionType.TEXT,
            content: 'Comment s’appelle le marteau de Thor ?',
            points: 5,
            answers: { create: [{ content: 'Mjölnir', isCorrect: true }] },
          }),
          q({
            type: QuestionType.MULTI_TEXT,
            content: 'Donne 3 dieux grecs liés à la mer (ordre libre).',
            points: 2,
            strictOrder: false,
            answers: {
              create: [
                { content: 'Poséidon', isCorrect: true },
                { content: 'Triton', isCorrect: true },
                { content: 'Nérée', isCorrect: true },
                { content: 'Océan', isCorrect: true },
              ],
            },
          }),
        ],
      },
    },
  });

  console.log('✅ Quiz créés:', { quizPop: quizPop.id, quizJS: quizJS.id, quizFrance: quizFrance.id, quizMytho: quizMytho.id });

  // Scores (variés, pas tous parfaits)
  // Pop: max = 2+3+5+6=16
  // JS: max = 2+3+5+9=19
  // France: max = 2+3+5+6=16
  // Mytho: max = 2+3+5+6=16
  await prisma.score.createMany({
    data: [
      { userId: bob.id, quizId: quizPop.id, totalScore: 13 },
      { userId: charlie.id, quizId: quizPop.id, totalScore: 16 },

      { userId: alice.id, quizId: quizJS.id, totalScore: 14 },
      { userId: charlie.id, quizId: quizJS.id, totalScore: 19 },

      { userId: alice.id, quizId: quizFrance.id, totalScore: 11 },
      { userId: bob.id, quizId: quizFrance.id, totalScore: 16 },

      // quiz privé: seul admin ou tests internes
      { userId: admin.id, quizId: quizMytho.id, totalScore: 16 },
    ],
  });

  console.log('✅ Scores créés');
  console.log('🎉 Seed terminé avec succès !');
  console.log('\n🔐 Comptes:');
  console.log('- admin@example.com / password123 (ADMIN)');
  console.log('- alice@example.com / password123');
  console.log('- bob@example.com / password123');
  console.log('- charlie@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
