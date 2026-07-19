import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recomputeElo } from '@/lib/eloBackfill';

export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization') ?? '';
    const secret = process.env.CRON_SECRET;
    const expected = `Bearer ${secret}`;
    const authorized =
        secret &&
        auth.length === expected.length &&
        timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // La suppression emporte les attempts en cascade : on note les types de jeu
        // concernés pour recalculer l'ELO après coup (sinon les notes dérivent).
        const affected = await prisma.attempt.findMany({
            where: { user: { isAnonymous: true, role: 'GUEST' } },
            select: { gameType: true },
            distinct: ['gameType'],
        });

        const deleted = await prisma.user.deleteMany({
            where: {
                isAnonymous: true,
                role: 'GUEST',
            },
        });

        if (affected.length > 0) {
            try {
                await recomputeElo(prisma, affected.map(a => a.gameType as string));
            } catch (err) {
                console.error('[GET /api/cron/cleanup] recomputeElo', err);
            }
        }

        console.log(`✅ Cron OK — ${deleted.count} guests supprimés`);
        return NextResponse.json({ ok: true, deleted: deleted.count });

    } catch (err) {
        console.error('❌ Cron failed:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
