// src/app/api/admin/attempts/route.ts
// Suppression admin d'attempts (une partie entière par gameId, ou un seul joueur via userId).
// Recalcule l'ELO des jeux concernés pour éviter toute dérive des notes.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { recomputeElo } from '@/lib/eloBackfill';

export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const userId = searchParams.get('userId'); // optionnel : ne supprimer qu'un joueur

    if (!gameId) {
        return NextResponse.json({ error: 'gameId requis' }, { status: 400 });
    }

    const where = userId ? { gameId, userId } : { gameId };

    const affected = await prisma.attempt.findMany({ where, select: { gameType: true } });
    if (affected.length === 0) {
        return NextResponse.json({ ok: true, deleted: 0 });
    }
    const gameTypes = [...new Set(affected.map(a => a.gameType as string))];

    const res = await prisma.attempt.deleteMany({ where });

    // Recalcul ELO des jeux touchés (recomputeElo ignore les types non notés)
    try {
        await recomputeElo(prisma, gameTypes);
    } catch (err) {
        console.error('[DELETE /api/admin/attempts] recomputeElo', err);
    }

    return NextResponse.json({ ok: true, deleted: res.count });
}
