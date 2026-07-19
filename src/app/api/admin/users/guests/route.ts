import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { recomputeElo } from '@/lib/eloBackfill';

export async function DELETE() {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // La suppression emporte les attempts en cascade : on note les types de jeu
    // concernés pour recalculer l'ELO après coup (sinon les notes dérivent).
    const affected = await prisma.attempt.findMany({
        where: { user: { role: 'GUEST' } },
        select: { gameType: true },
        distinct: ['gameType'],
    });

    const { count } = await prisma.user.deleteMany({ where: { role: 'GUEST' } });

    if (affected.length > 0) {
        try {
            await recomputeElo(prisma, affected.map(a => a.gameType as string));
        } catch (err) {
            console.error('[DELETE /api/admin/users/guests] recomputeElo', err);
        }
    }

    return NextResponse.json({ deleted: count });
}
