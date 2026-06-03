// prisma/seed-prod.ts
import dotenv from 'dotenv';
dotenv.config();

import crypto from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { cleanDatabase, seedShared } from './seed-shared';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
    console.log('🌱 Début du seed (prod)...');

    await cleanDatabase(prisma);

    const randomUser = await prisma.user.upsert({
        where: { email: 'random@quiz.app' },
        update: {},
        create: {
            email: 'random@quiz.app',
            username: 'Bot🤖',
            role: 'RANDOM',
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
        },
    });

    await seedShared(prisma, randomUser.id);

    console.log('\n✅ Seed prod terminé !');
}

main()
    .catch(e => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
