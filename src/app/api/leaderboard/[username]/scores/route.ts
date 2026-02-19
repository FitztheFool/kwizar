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

        const scores = await prisma.score.findMany({
            where: { userId: user.id },
            orderBy: { completedAt: 'desc' },
            select: {
                totalScore: true,
                completedAt: true,
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

        const quizScores = scores.map((s) => ({
            quizId: s.quiz.id,
            quizTitle: s.quiz.title,
            score: s.totalScore,
            maxScore: s.quiz.questions.reduce((sum, q) => sum + q.points, 0),
            completedAt: s.completedAt.toISOString(),
        }));

        return NextResponse.json({ quizScores });
    } catch (error) {
        console.error('[GET /api/leaderboard/[username]/scores]', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
