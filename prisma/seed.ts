// prisma/seed.ts

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { cleanDatabase, seedShared } from './seed-shared';
import {
    seedQuizAttempts, seedUnoAttempts, seedSkyjowAttempts,
    seedTabooAttempts, seedYahtzeeAttempts, seedPuissance4Attempts,
    seedJustOneAttempts, seedBattleshipAttempts, seedDiamantAttempts,
    seedImpostorAttempts, seedSnakeAttempts, seedPacmanAttempts, seedBreakoutAttempts,
    seedTetrisAttempts, seedLudoAttempts, seedPerudoAttempts,
    seedCantStopAttempts, seedMilleBornesAttempts,
    seed2048Attempts, seedSutomAttempts, seedSpaceInvadersAttempts,
    seedFlappyBirdAttempts, seedPlumberAttempts, seedAtlantideAttempts,
    seedSpyfallAttempts, seedBlokusAttempts, seedSixQuiPrendAttempts,
    seedAbaloneAttempts, seedMatch3Attempts,
    seedDamesAttempts, seedBackgammonAttempts, seedTanksAttempts,
    seedComplotAttempts, seedDemineurAttempts, seedSudokuAttempts, seedDuelAttempts,
} from './seed-attempts';
import { backfillElo } from './backfill-elo';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
    console.log('🌱 Début du seed (dev)...');

    await cleanDatabase(prisma);

    const hash = await bcrypt.hash('123456', 10);
    const upsert = (email: string, username: string, role: 'ADMIN' | 'RANDOM' | 'USER', status: 'ACTIVE' | 'PENDING' = 'ACTIVE') =>
        prisma.user.upsert({ where: { email }, update: { status }, create: { email, username, role, status, passwordHash: hash } });

    const adminUser = await upsert('admin@quiz.app', 'Admin', 'ADMIN');
    const randomUser = await upsert('random@quiz.app', 'Bot🤖', 'RANDOM');
    const farosUser = await upsert('faros@quiz.app', 'Faros', 'USER');
    const user = await upsert('user@quiz.app', 'User', 'USER');

    const numbered = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
            upsert(`user${i + 1}@quiz.app`, `User${i + 1}`, 'USER', i < 12 ? 'ACTIVE' : 'PENDING')
        )
    );
    const [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12] = numbered;
    console.log('✅ Utilisateurs créés');

    // ── Pool social : UNIQUEMENT des joueurs ACTIFS ──
    // Les amitiés, demandes d'amis et messages ne concernent QUE des comptes ACTIVE.
    // (Bot🤖 et les comptes PENDING — User13..20 — sont volontairement exclus ; Admin est inclus.)
    const socialUsers = [adminUser, farosUser, user, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12];
    const nonActive = socialUsers.filter(u => u.status !== 'ACTIVE');
    if (nonActive.length > 0) {
        throw new Error(`Seed: joueurs non-ACTIF interdits dans le social → ${nonActive.map(u => u.username).join(', ')}`);
    }

    // ── Amitiés de test ──
    const friendship = (requesterId: string, addresseeId: string, status: 'PENDING' | 'ACCEPTED') =>
        prisma.friendship.upsert({
            where: { requesterId_addresseeId: { requesterId, addresseeId } },
            update: { status },
            create: { requesterId, addresseeId, status },
        });
    await Promise.all([
        // — Amis de Faros (ACCEPTED) : assez nombreux pour tester recherche + pagination du panneau d'invitation —
        friendship(farosUser.id, user.id, 'ACCEPTED'),
        friendship(farosUser.id, user1.id, 'ACCEPTED'),
        friendship(farosUser.id, user2.id, 'ACCEPTED'),
        friendship(farosUser.id, user3.id, 'ACCEPTED'),
        friendship(farosUser.id, user4.id, 'ACCEPTED'),
        friendship(farosUser.id, user5.id, 'ACCEPTED'),
        friendship(farosUser.id, user6.id, 'ACCEPTED'),
        friendship(farosUser.id, user7.id, 'ACCEPTED'),
        friendship(farosUser.id, user8.id, 'ACCEPTED'),
        friendship(farosUser.id, user9.id, 'ACCEPTED'),
        friendship(adminUser.id, farosUser.id, 'ACCEPTED'),

        // — Amis d'Admin (ACCEPTED) —
        friendship(adminUser.id, user1.id, 'ACCEPTED'),
        friendship(adminUser.id, user2.id, 'ACCEPTED'),
        friendship(adminUser.id, user3.id, 'ACCEPTED'),
        friendship(adminUser.id, user4.id, 'ACCEPTED'),
        friendship(adminUser.id, user5.id, 'ACCEPTED'),
        friendship(adminUser.id, user6.id, 'ACCEPTED'),
        friendship(adminUser.id, user7.id, 'ACCEPTED'),

        // — Amis de User (ACCEPTED) —
        friendship(user.id, user1.id, 'ACCEPTED'),
        friendship(user.id, user2.id, 'ACCEPTED'),
        friendship(user.id, user3.id, 'ACCEPTED'),
        friendship(user.id, user4.id, 'ACCEPTED'),

        // — Amitiés entre users —
        friendship(user1.id, user2.id, 'ACCEPTED'),
        friendship(user1.id, user3.id, 'ACCEPTED'),
        friendship(user2.id, user4.id, 'ACCEPTED'),
        friendship(user2.id, user5.id, 'ACCEPTED'),
        friendship(user5.id, user6.id, 'ACCEPTED'),
        friendship(user6.id, user7.id, 'ACCEPTED'),
        friendship(user7.id, user8.id, 'ACCEPTED'),
        friendship(user8.id, user9.id, 'ACCEPTED'),
        friendship(user9.id, user10.id, 'ACCEPTED'),

        // — Demandes reçues par Faros (incoming → badge "Amis") —
        friendship(user10.id, farosUser.id, 'PENDING'),
        friendship(user11.id, farosUser.id, 'PENDING'),
        friendship(user12.id, farosUser.id, 'PENDING'),

        // — Demandes reçues par User —
        friendship(user5.id, user.id, 'PENDING'),
        friendship(user6.id, user.id, 'PENDING'),
        friendship(adminUser.id, user.id, 'PENDING'),

        // — Demandes reçues par Admin (incoming → badge "Amis") —
        friendship(user8.id, adminUser.id, 'PENDING'),
        friendship(user9.id, adminUser.id, 'PENDING'),
        friendship(user10.id, adminUser.id, 'PENDING'),

        // — Demandes envoyées par User (outgoing, en attente) —
        friendship(user.id, user7.id, 'PENDING'),
        friendship(user.id, user8.id, 'PENDING'),
    ]);
    console.log('✅ Amitiés créées');

    // ── Messages privés de test (entre joueurs ACTIFS, surtout des amis) ──
    const now = Date.now();
    const dm = (senderId: string, recipientId: string, body: string, minsAgo: number, read: boolean) =>
        prisma.directMessage.create({
            data: {
                senderId, recipientId, body,
                createdAt: new Date(now - minsAgo * 60_000),
                readAt: read ? new Date(now - (minsAgo - 1) * 60_000) : null,
            },
        });

    // Faros ↔ User
    await dm(farosUser.id, user.id, 'Salut ! On fait une partie ?', 120, true);
    await dm(user.id, farosUser.id, 'Carrément, je lance un lobby UNO 🎉', 118, true);
    await dm(farosUser.id, user.id, 'Go, je te rejoins', 115, true);
    await dm(user.id, farosUser.id, 'GG pour la dernière 😄', 30, true);
    await dm(farosUser.id, user.id, 'Revanche ce soir ?', 5, false); // non lu côté User

    // Faros ↔ User1
    await dm(user1.id, farosUser.id, 'Hey, tu joues au Skyjo ?', 200, true);
    await dm(farosUser.id, user1.id, 'Toujours partant !', 198, true);
    await dm(user1.id, farosUser.id, "Je t'ai envoyé une invitation", 10, false); // non lu côté Faros

    // Faros ↔ User2
    await dm(farosUser.id, user2.id, 'Bien joué au Yahtzee 🎲', 300, true);
    await dm(user2.id, farosUser.id, 'Merci ! la chance 😅', 295, true);
    await dm(user2.id, farosUser.id, 'On remet ça ?', 3, false); // non lu côté Faros

    // Admin ↔ Faros
    await dm(adminUser.id, farosUser.id, 'Bienvenue sur Kwizar ! 👋', 400, true);
    await dm(farosUser.id, adminUser.id, 'Merci 🙌', 398, true);
    await dm(adminUser.id, farosUser.id, "N'hésite pas si tu as des retours", 8, false); // non lu côté Faros

    // Admin ↔ User1
    await dm(adminUser.id, user1.id, 'Tu valides la nouvelle catégorie de quiz ?', 150, true);
    await dm(user1.id, adminUser.id, 'Oui nickel 👌', 148, true);
    await dm(user1.id, adminUser.id, 'Par contre il y a un bug sur le classement', 6, false); // non lu côté Admin

    // Admin ↔ User2
    await dm(user2.id, adminUser.id, 'Salut Admin, possible de reset mon score ?', 50, true);
    await dm(adminUser.id, user2.id, "C'est fait 👍", 48, true);
    await dm(user2.id, adminUser.id, 'Merci beaucoup 🙏', 4, false); // non lu côté Admin

    // User ↔ User1
    await dm(user.id, user1.id, 'Dispo pour un Puissance 4 ?', 90, true);
    await dm(user1.id, user.id, 'Oui go 🔴🟡', 88, true);

    // Faros ↔ nouveaux amis (User3..User9)
    await dm(user3.id, farosUser.id, 'Salut Faros, on teste le mode spectateur ?', 70, true);
    await dm(farosUser.id, user3.id, 'Oui ! rejoins mon lobby', 68, true);
    await dm(user4.id, farosUser.id, 'Tu es dispo ce soir ?', 40, false); // non lu côté Faros
    await dm(farosUser.id, user5.id, 'Belle partie de Blokus 🟦', 25, true);
    await dm(user5.id, farosUser.id, 'Merci 😄 revanche ?', 22, false); // non lu côté Faros
    await dm(user6.id, farosUser.id, 'Ajoute-moi à la prochaine !', 12, false); // non lu côté Faros
    await dm(farosUser.id, user7.id, 'GG au Perudo 🎲', 15, true);
    await dm(user8.id, farosUser.id, 'On se fait un Skyjo ?', 9, false); // non lu côté Faros
    await dm(farosUser.id, user9.id, 'Bien joué 👏', 7, true);

    console.log('✅ Messages privés créés');

    await seedShared(prisma, randomUser.id);

    const allPlayers = [farosUser, user, ...numbered];
    await seedQuizAttempts(prisma, { faros: farosUser, user1, user2, user3, user4, user5 });
    await seedUnoAttempts(prisma, allPlayers.slice(0, 10));
    await seedSkyjowAttempts(prisma, allPlayers.slice(0, 10));
    await seedTabooAttempts(prisma, allPlayers);
    await seedYahtzeeAttempts(prisma, allPlayers.slice(0, 10));
    await seedPuissance4Attempts(prisma, allPlayers.slice(0, 10));
    await seedJustOneAttempts(prisma, allPlayers.slice(0, 10));
    await seedBattleshipAttempts(prisma, allPlayers);
    await seedDiamantAttempts(prisma, allPlayers);
    await seedImpostorAttempts(prisma, allPlayers);
    await seedSnakeAttempts(prisma, allPlayers);
    await seedPacmanAttempts(prisma, allPlayers);
    await seedBreakoutAttempts(prisma, allPlayers);
    await seedTetrisAttempts(prisma, allPlayers);
    await seedLudoAttempts(prisma, allPlayers);
    await seedPerudoAttempts(prisma, allPlayers);
    await seedCantStopAttempts(prisma, allPlayers);
    await seedMilleBornesAttempts(prisma, allPlayers);
    await seed2048Attempts(prisma, allPlayers);
    await seedSutomAttempts(prisma, allPlayers);
    await seedSpaceInvadersAttempts(prisma, allPlayers);
    await seedFlappyBirdAttempts(prisma, allPlayers);
    await seedPlumberAttempts(prisma, allPlayers);
    await seedAtlantideAttempts(prisma, allPlayers);
    await seedSpyfallAttempts(prisma, allPlayers);
    await seedBlokusAttempts(prisma, allPlayers);
    await seedSixQuiPrendAttempts(prisma, allPlayers);
    await seedAbaloneAttempts(prisma, allPlayers);
    await seedMatch3Attempts(prisma, allPlayers);
    await seedDamesAttempts(prisma, allPlayers);
    await seedBackgammonAttempts(prisma, allPlayers);
    await seedTanksAttempts(prisma, allPlayers);
    await seedComplotAttempts(prisma, allPlayers);
    await seedDemineurAttempts(prisma, allPlayers);
    await seedSudokuAttempts(prisma, allPlayers);
    await seedDuelAttempts(prisma, allPlayers);

    // Calcul des notes ELO à partir des parties seedées
    await backfillElo(prisma);

    console.log('\n✅ Seed dev terminé !');
}

main()
    .catch(e => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
