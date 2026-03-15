import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    if (!username) {
        return NextResponse.json({ error: 'Username manquant.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            deletedAt: true,
            deactivatedAt: true,
            createdQuizzes: {
                where: { isPublic: true },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    isPublic: true,
                    createdAt: true,
                    creatorId: true,
                    category: { select: { name: true } },
                    _count: { select: { questions: true } },
                    questions: { select: { points: true } },
                },
            },
            attempts: {
                select: {
                    score: true,
                    gameType: true,
                },
            },
        },
    });

    if (!user || user.deletedAt || user.deactivatedAt) {
        return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const totalScore = user.attempts.reduce((sum, a) => sum + a.score, 0);
    const quizzesCompleted = user.attempts.filter(a => a.gameType === 'QUIZ').length;
    const quizzesCreated = user.createdQuizzes.length;

    return NextResponse.json({
        id: user.id,
        name: user.username ?? user.name,
        image: user.image,
        totalScore,
        quizzesCompleted,
        quizzesCreated,
        quizzes: user.createdQuizzes,
    });
}
