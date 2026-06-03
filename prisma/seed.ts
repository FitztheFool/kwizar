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
} from './seed-attempts';

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
        Array.from({ length: 10 }, (_, i) =>
            upsert(`user${i + 1}@quiz.app`, `User${i + 1}`, 'USER', i < 5 ? 'ACTIVE' : 'PENDING')
        )
    );
    const [user1, user2, user3, user4, user5] = numbered;
    console.log('✅ Utilisateurs créés');

    // ── Amitiés de test ──
    const friendship = (requesterId: string, addresseeId: string, status: 'PENDING' | 'ACCEPTED') =>
        prisma.friendship.upsert({
            where: { requesterId_addresseeId: { requesterId, addresseeId } },
            update: { status },
            create: { requesterId, addresseeId, status },
        });
    await Promise.all([
        friendship(farosUser.id, user.id, 'ACCEPTED'),   // Faros & User sont amis
        friendship(user.id, user1.id, 'ACCEPTED'),        // User & User1 sont amis
        friendship(farosUser.id, user2.id, 'ACCEPTED'),   // Faros & User2 sont amis
        friendship(user3.id, user.id, 'PENDING'),         // User3 a envoyé une demande à User
    ]);
    console.log('✅ Amitiés créées');

    // ── Messages privés de test (entre Faros & User, qui sont amis) ──
    const now = Date.now();
    const dm = (senderId: string, recipientId: string, body: string, minsAgo: number, readAt: Date | null) =>
        prisma.directMessage.create({
            data: { senderId, recipientId, body, createdAt: new Date(now - minsAgo * 60_000), readAt },
        });
    await dm(farosUser.id, user.id, 'Salut ! On fait une partie ?', 60, new Date(now - 58 * 60_000));
    await dm(user.id, farosUser.id, 'Carrément, je lance un lobby UNO 🎉', 58, new Date(now - 57 * 60_000));
    await dm(farosUser.id, user.id, 'Go, je te rejoins', 2, null); // non lu côté User
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

    console.log('\n✅ Seed dev terminé !');
}

main()
    .catch(e => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
