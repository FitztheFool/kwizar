import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

function getSinceForRecentActivity(period: number) {
    // -1 = aujourd'hui (depuis minuit serveur)
    if (period === -1) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return { gte: start };
    }

    // 0 = tout
    if (!Number.isFinite(period) || period === 0) return null;

    // >0 = X derniers jours (glissant)
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

    // ✅ on accepte -1, 0, 1, 7, 30...
    const period = Number.isFinite(periodRaw) ? (periodRaw < -1 ? 30 : periodRaw) : 30;

    // ✅ filtre uniquement pour l'activité récente
    const sinceFilter = getSinceForRecentActivity(period);
    const recentWhere = sinceFilter ? { createdAt: sinceFilter } : {};

    const [totalUsers, totalQuizzes, totalAttemptsAllTime, topQuizzesAllTime, recentActivity, totalPointsAllTime] =
        await Promise.all([
            prisma.user.count(),
            prisma.quiz.count(),
            prisma.attempt.count(), // ✅ all-time

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
                where: recentWhere, // ✅ period appliqué ici seulement
                select: {
                    createdAt: true,
                    score: true,
                    quiz: { select: { title: true } },
                    user: { select: { username: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),

            prisma.attempt.aggregate({ _sum: { score: true } }), // ✅ all-time
        ]);

    const quizzesWithStats = topQuizzesAllTime.map((quiz) => {
        const scores = quiz.attempts.map((a) => a.score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
        const maxPossibleScore = quiz.questions.reduce((sum, q) => sum + (q.points ?? 0), 0);

        return {
            id: quiz.id,
            title: quiz.title,
            playCount: quiz._count.attempts, // ✅ all-time
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
            scores: totalAttemptsAllTime, // ✅ all-time
            pointsScored: totalPointsAllTime._sum.score ?? 0, // ✅ all-time
        },
        topQuizzes: quizzesWithStats, // ✅ all-time
        recentActivity: recentActivity.map((a) => ({
            completedAt: a.createdAt,
            totalScore: a.score,
            quiz: a.quiz,
            user: a.user,
        })),
    });
}
