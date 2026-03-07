import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') ?? '1');
    const pageSize = Number(searchParams.get('pageSize') ?? '6');

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safePageSize = Number.isNaN(pageSize) || pageSize < 1 ? 6 : pageSize;

    // ── Quiz attempts ─────────────────────────────────────────────
    const attempts = await prisma.attempt.findMany({
      where: { userId: session.user.id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            questions: { select: { points: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const quizAttempts = attempts.filter(
      (a) => a.gameType === 'QUIZ' && a.quiz
    );

    const attemptsCountByQuiz = quizAttempts.reduce<Record<string, number>>(
      (acc, a) => {
        const quizId = a.quiz!.id;
        acc[quizId] = (acc[quizId] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const quizScores = Object.values(
      quizAttempts.reduce((acc, a) => {
        const quizId = a.quiz!.id;

        const maxScore = a.quiz!.questions.reduce(
          (sum, q) => sum + q.points,
          0
        );

        if (!acc[quizId] || a.score > acc[quizId].totalScore) {
          acc[quizId] = {
            quiz: {
              id: a.quiz!.id,
              title: a.quiz!.title,
            },
            totalScore: a.score,
            completedAt: a.createdAt,
            maxScore,
            attempts: attemptsCountByQuiz[quizId] ?? 1,
          };
        }

        return acc;
      }, {} as Record<
        string,
        {
          quiz: { id: string; title: string };
          totalScore: number;
          completedAt: Date;
          maxScore: number;
          attempts: number;
        }
      >)
    ).sort(
      (a, b) =>
        new Date(b.completedAt).getTime() -
        new Date(a.completedAt).getTime()
    );

    // ── UNO stats ─────────────────────────────────────────────

    const unoWhere = {
      userId: session.user.id,
      gameType: 'UNO' as const,
    };

    const [unoAttemptsAll, recentGames, recentGamesTotal] =
      await Promise.all([
        prisma.attempt.findMany({
          where: unoWhere,
          select: {
            score: true,
            placement: true,
            createdAt: true,
          },
        }),

        prisma.attempt.findMany({
          where: unoWhere,
          select: {
            placement: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (safePage - 1) * safePageSize,
          take: safePageSize,
        }),

        prisma.attempt.count({
          where: unoWhere,
        }),
      ]);

    const unoStats = {
      gamesPlayed: unoAttemptsAll.length,

      totalScore: unoAttemptsAll.reduce(
        (sum, a) => sum + a.score,
        0
      ),

      top1: unoAttemptsAll.filter((a) => a.placement === 1).length,
      top2: unoAttemptsAll.filter((a) => a.placement === 2).length,
      top3: unoAttemptsAll.filter((a) => a.placement === 3).length,

      podiums: unoAttemptsAll.filter(
        (a) => a.placement !== null && a.placement <= 3
      ).length,

      wins: unoAttemptsAll.filter((a) => a.placement === 1).length,

      bestPlacement:
        unoAttemptsAll.length > 0
          ? Math.min(...unoAttemptsAll.map((a) => a.placement ?? 999))
          : null,

      recentGames,

      recentGamesTotal,

      recentGamesTotalPages: Math.ceil(
        recentGamesTotal / safePageSize
      ),
    };

    return NextResponse.json({
      quizScores,
      unoStats,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des scores:',
      error
    );

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
