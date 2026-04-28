// src/app/api/attempts/route.ts
// Route interne appelée par les serveurs de jeu
// Auth : Authorization: Bearer <INTERNAL_API_KEY>

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ScoreEntry {
    userId: string;
    score: number;
    placement?: number | null;
    trapScore?: number;
    rounds?: number;
    correctAnswers?: number;
    totalAnswers?: number;
    abandon?: boolean;
    afk?: boolean;
}

interface BotScore {
    username: string;
    score: number;
    placement: number;
}

interface AttemptPayload {
    gameType: string;
    gameId: string;
    quizId?: string;
    vsBot?: boolean;
    bots?: BotScore[];
    scores: ScoreEntry[];
}

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    const secret = process.env.INTERNAL_API_KEY;
    const expected = `Bearer ${secret}`;

    // Comparaison en temps constant pour éviter les timing attacks
    const authorized =
        secret &&
        auth &&
        auth.length === expected.length &&
        require('crypto').timingSafeEqual(Buffer.from(auth), Buffer.from(expected));

    if (!authorized) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const body: AttemptPayload = await req.json();
        const { gameType, gameId, quizId, vsBot, bots, scores } = body;

        if (!gameType || !gameId || !Array.isArray(scores) || scores.length === 0) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        }

        // Vérifier que les userId existent en BDD
        const existingUsers = await prisma.user.findMany({
            where: { id: { in: scores.map(s => s.userId) } },
            select: { id: true },
        });
        const validUserIds = new Set(existingUsers.map(u => u.id));
        const validScores = scores.filter(s => validUserIds.has(s.userId));

        if (validScores.length === 0) {
            return NextResponse.json({ ok: true, saved: 0 });
        }

        // Bot scores stored (as JSON) on the first (highest-placed) human attempt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const botScoresJson: any = bots && bots.length > 0 ? bots : null;

        await Promise.all(
            validScores.map((s, i) => {
                const botScores = i === 0 ? botScoresJson : null;
                return prisma.attempt.upsert({
                    where: { userId_gameId: { userId: s.userId, gameId } },
                    update: {
                        score: s.score,
                        placement: s.placement ?? null,
                        trapScore: s.trapScore ?? 0,
                        rounds: s.rounds ?? 0,
                        correctAnswers: s.correctAnswers ?? 0,
                        totalAnswers: s.totalAnswers ?? 0,
                        abandon: s.abandon ?? false,
                        afk: s.afk ?? false,
                        vsBot: vsBot ?? false,
                        ...(botScores !== null ? { botScores } : {}),
                    },
                    create: {
                        userId: s.userId,
                        gameType: gameType as any,
                        gameId,
                        quizId: quizId ?? null,
                        score: s.score,
                        placement: s.placement ?? null,
                        trapScore: s.trapScore ?? 0,
                        rounds: s.rounds ?? 0,
                        correctAnswers: s.correctAnswers ?? 0,
                        totalAnswers: s.totalAnswers ?? 0,
                        abandon: s.abandon ?? false,
                        afk: s.afk ?? false,
                        vsBot: vsBot ?? false,
                        botScores,
                    },
                });
            })
        );

        return NextResponse.json({ ok: true, saved: validScores.length });
    } catch (error) {
        console.error('[POST /api/attempts]', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
