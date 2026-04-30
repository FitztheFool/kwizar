import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifySoloToken } from '@/lib/soloToken';
import prisma from '@/lib/prisma';

const MIN_DURATION_MS = 10_000; // 10 s minimum de jeu

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    try {
        const { score, token, level } = await req.json();

        if (typeof score !== 'number' || score < 0 || score > 1_000_000) {
            return NextResponse.json({ error: 'Score invalide' }, { status: 400 });
        }

        const check = verifySoloToken(token, session.user.id, 'PACMAN', MIN_DURATION_MS);
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 });
        }

        const rounds = typeof level === 'number' && level > 0 ? level : 1;

        await prisma.attempt.upsert({
            where:  { userId_gameId: { userId: session.user.id, gameId: token } },
            update: { score: { set: score }, rounds },
            create: { userId: session.user.id, gameType: 'PACMAN', gameId: token, score, rounds },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[POST /api/pacman/submit]', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
