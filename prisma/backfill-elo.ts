// prisma/backfill-elo.ts
// Backfill ELO complet à partir des attempts existantes.
// Appelé en fin de seed (prisma/seed.ts) et lançable seul :  npm run db:backfill-elo
// La logique vit dans src/lib/eloBackfill.ts (réutilisée par la suppression admin).

import { PrismaClient } from '../src/generated/prisma/client';
import { recomputeElo } from '../src/lib/eloBackfill';

/** Recalcule l'ELO de tous les jeux notés. */
export async function backfillElo(prisma: PrismaClient): Promise<void> {
    await recomputeElo(prisma);
}

// ── CLI : npm run db:backfill-elo (ne s'exécute pas lors d'un import) ────────────
async function runCli() {
    const dotenv = await import('dotenv');
    dotenv.config();
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
    console.log('🔄 Backfill ELO — début');
    await backfillElo(prisma)
        .catch(e => { console.error('❌ Backfill ELO échec', e); process.exit(1); })
        .finally(() => prisma.$disconnect());
}

if (process.argv[1] && process.argv[1].includes('backfill-elo')) {
    runCli();
}
