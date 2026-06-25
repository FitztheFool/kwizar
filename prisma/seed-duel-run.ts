// prisma/seed-duel-run.ts
// Seed standalone des Duels intégrés, SANS cleanDatabase : sûr à lancer sur une
// prod vivante (ne supprime aucun deck/utilisateur). `npm run db:seed-duel`.
import dotenv from 'dotenv';
dotenv.config();

import crypto from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { seedDuelDecks } from './seed-duel';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
    console.log('🌱 Seed des Duels intégrés…');
    const owner = await prisma.user.upsert({
        where: { email: 'random@quiz.app' },
        update: {},
        create: {
            email: 'random@quiz.app',
            username: 'Bot🤖',
            role: 'RANDOM',
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
        },
    });
    await seedDuelDecks(prisma, owner.id);
    console.log('\n✅ Terminé !');
}

main()
    .catch(e => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
