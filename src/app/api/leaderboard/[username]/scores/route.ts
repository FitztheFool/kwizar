// app/api/leaderboard/[username]/scores/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const attempts = await prisma.attempt.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                score: true,
                createdAt: true,
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        questions: {
                            select: { points: true },
                        },
                    },
                },
            },
        });

        const quizScores = attempts
            .filter(a => a.quiz !== null)
            .map((a) => ({
                quizId: a.quiz!.id,
                quizTitle: a.quiz!.title,
                score: a.score,
                maxScore: a.quiz!.questions.reduce((sum, q) => sum + q.points, 0),
                completedAt: a.createdAt.toISOString(),
            }));

        return NextResponse.json({ quizScores });
    } catch (error) {
        console.error('[GET /api/leaderboard/[username]/scores]', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
