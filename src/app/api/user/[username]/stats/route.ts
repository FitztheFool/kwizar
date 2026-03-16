import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GAME_CONFIG } from '@/lib/gameConfig';
import type { GameType } from '@prisma/client';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const pageSize = 20;
    const skip = (page - 1) * pageSize;
    const gameTypeFilter = searchParams.get('gameType') as GameType | null;

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, image: true, deactivatedAt: true, deletedAt: true },
    });

    if (!user || user.deactivatedAt || user.deletedAt) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // gameStats : toujours toutes les parties, sans filtre
    const allAttempts = await prisma.attempt.findMany({
        where: { userId: user.id },
        select: { gameType: true, score: true, placement: true },
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

    // Activité récente : filtre gameType appliqué directement en DB
    const where = {
        userId: user.id,
        ...(gameTypeFilter ? { gameType: gameTypeFilter } : {}),
    };

    // On récupère les gameIds distincts pour la pagination
    const distinctGames = await prisma.attempt.findMany({
        where,
        distinct: ['gameId'],
        select: { gameId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });

    const totalGames = distinctGames.length;
    const totalPages = Math.ceil(totalGames / pageSize);
    const paginatedGameIds = distinctGames.slice(skip, skip + pageSize).map(g => g.gameId);

    // Attempts de l'utilisateur sur les parties paginées
    const recentAttempts = await prisma.attempt.findMany({
        where: { userId: user.id, gameId: { in: paginatedGameIds } },
        include: { quiz: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
    });

    // Tous les joueurs des parties paginées
    const allPlayersInGames = await prisma.attempt.findMany({
        where: { gameId: { in: paginatedGameIds } },
        include: { user: { select: { username: true } } },
        orderBy: { placement: 'asc' },
    });

    const playersByGame = new Map<string, { username: string; score: number; placement: number | null }[]>();
    for (const a of allPlayersInGames) {
        if (!playersByGame.has(a.gameId)) playersByGame.set(a.gameId, []);
        playersByGame.get(a.gameId)!.push({
            username: a.user.username ?? 'Inconnu',
            score: a.score,
            placement: a.placement,
        });
    }

    const byGame = new Map<string, typeof recentAttempts>();
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
            players: playersByGame.get(gameId) ?? [],
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
