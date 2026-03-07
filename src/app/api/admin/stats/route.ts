import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

function getSinceForRecentActivity(period: number) {
    if (period === -1) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return { gte: start };
    }

    if (!Number.isFinite(period) || period === 0) return null;

    if (period > 0) {
        return { gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000) };
    }

    return null;
}

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const periodRaw = Number.parseInt(searchParams.get('period') || '30', 10);
    const period = Number.isFinite(periodRaw) ? (periodRaw < -1 ? 30 : periodRaw) : 30;

    const sinceFilter = getSinceForRecentActivity(period);
    const recentWhere = sinceFilter ? { createdAt: sinceFilter } : {};

    const [
        totalUsers,
        totalQuizzes,
        unoGamesAllTime,
        topQuizzesAllTime,
        recentActivity,
        totalPointsAllTime,
    ] = await Promise.all([
        prisma.user.count(),

        prisma.quiz.count(),

        prisma.attempt.groupBy({
            by: ['gameId'],
            where: {
                gameType: 'UNO',
            },
        }),

        prisma.quiz.findMany({
            select: {
                id: true,
                title: true,
                _count: { select: { attempts: true } },
                attempts: { select: { score: true } },
                questions: { select: { points: true } },
            },
            orderBy: { attempts: { _count: 'desc' } },
            take: 10,
        }),

        prisma.attempt.findMany({
            where: recentWhere,
            select: {
                createdAt: true,
                score: true,
                gameType: true,
                placement: true,
                gameId: true,
                quiz: { select: { title: true } },
                user: { select: { username: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),

        prisma.attempt.aggregate({
            _sum: { score: true },
        }),
    ]);

    const totalUnoGamesAllTime = unoGamesAllTime.length;

    const unoGameIds = [
        ...new Set(
            recentActivity
                .filter((a) => a.gameType === 'UNO' && a.gameId)
                .map((a) => a.gameId)
        ),
    ];

    const unoPlayerCounts =
        unoGameIds.length > 0
            ? await prisma.attempt.groupBy({
                by: ['gameId'],
                where: {
                    gameId: { in: unoGameIds },
                    gameType: 'UNO',
                },
                _count: { userId: true },
            })
            : [];

    const playerCountByGameId = Object.fromEntries(
        unoPlayerCounts.map((g) => [g.gameId, g._count.userId])
    );

    const quizzesWithStats = topQuizzesAllTime.map((quiz) => {
        const scores = quiz.attempts.map((a) => a.score);
        const avgScore =
            scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
        const maxPossibleScore = quiz.questions.reduce((sum, q) => sum + (q.points ?? 0), 0);

        return {
            id: quiz.id,
            title: quiz.title,
            playCount: quiz._count.attempts,
            avgScore,
            maxScore,
            maxPossibleScore,
            questionCount: quiz.questions.length,
        };
    });

    return NextResponse.json({
        totals: {
            users: totalUsers,
            quizzes: totalQuizzes,
            scores: totalUnoGamesAllTime,
            pointsScored: totalPointsAllTime._sum.score ?? 0,
        },
        topQuizzes: quizzesWithStats,
        recentActivity: recentActivity.map((a) => ({
            completedAt: a.createdAt,
            totalScore: a.score,
            type: a.gameType === 'UNO' ? 'uno' : 'quiz',
            placement: a.placement,
            gameId: a.gameId,
            playerCount: a.gameId ? (playerCountByGameId[a.gameId] ?? 1) : 1,
            quiz: a.quiz,
            user: a.user,
        })),
    });
}
