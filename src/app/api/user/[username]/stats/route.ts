import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GAME_CONFIG } from '@/lib/gameConfig';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, image: true, deactivatedAt: true, deletedAt: true },
    });

    if (!user || user.deactivatedAt || user.deletedAt) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const allAttempts = await prisma.attempt.findMany({
        where: { userId: user.id },
        include: { quiz: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
    });

    const gameStats: Record<string, { count: number; points: number; wins: number }> = {};
    for (const key of Object.keys(GAME_CONFIG)) {
        const type = GAME_CONFIG[key as keyof typeof GAME_CONFIG].gameType;
        gameStats[type] = { count: 0, points: 0, wins: 0 };
    }
    for (const a of allAttempts) {
        if (!gameStats[a.gameType]) gameStats[a.gameType] = { count: 0, points: 0, wins: 0 };
        gameStats[a.gameType].count++;
        gameStats[a.gameType].points += a.score;
        if (a.placement === 1) gameStats[a.gameType].wins++;
    }

    const gameIds = [...new Set(allAttempts.map(a => a.gameId))];
    const totalGames = gameIds.length;
    const totalPages = Math.ceil(totalGames / pageSize);
    const paginatedGameIds = gameIds.slice(skip, skip + pageSize);

    const recentAttempts = allAttempts.filter(a => paginatedGameIds.includes(a.gameId));

    const byGame = new Map<string, typeof allAttempts>();
    for (const a of recentAttempts) {
        if (!byGame.has(a.gameId)) byGame.set(a.gameId, []);
        byGame.get(a.gameId)!.push(a);
    }

    const recentActivity = paginatedGameIds.map(gameId => {
        const attempts = byGame.get(gameId) ?? [];
        const first = attempts[0];
        return {
            gameId,
            gameType: first.gameType,
            createdAt: first.createdAt,
            quiz: first.quiz ? { id: first.quiz.id, title: first.quiz.title } : null,
            score: first.score,
            placement: first.placement,
        };
    });

    return NextResponse.json({
        user: { id: user.id, username: user.username, image: user.image },
        gameStats,
        totalGames,
        recentActivity,
        pagination: { page, pageSize, totalGames, totalPages },
    });
}
