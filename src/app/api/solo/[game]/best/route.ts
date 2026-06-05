import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GameType } from '@/generated/prisma/client';

// The global record is user-agnostic → cache it per game (short TTL) to spare the DB.
const getGlobalBest = (gameType: GameType) =>
    unstable_cache(
        async () => {
            const agg = await prisma.attempt.aggregate({
                where: { gameType, user: { role: { not: 'RANDOM' } } },
                _max: { score: true },
            });
            return agg._max.score ?? 0;
        },
        ['solo-global-best', gameType],
        { revalidate: 60, tags: [`solo-global-best:${gameType}`] },
    )();

const SOLO_GAMES: Record<string, GameType> = {
    pacman:   'PACMAN',
    breakout: 'BREAKOUT',
    snake:    'SNAKE',
    tetris:   'TETRIS',
    sutom:    'SUTOM',
    space_invaders: 'SPACE_INVADERS',
    '2048': 'GAME_2048',
    flappy_bird: 'FLAPPY_BIRD',
    plumber: 'PLUMBER',
};

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ game: string }> }
) {
    const { game } = await params;
    const gameType = SOLO_GAMES[game];
    if (!gameType) return NextResponse.json({ error: 'Jeu invalide' }, { status: 400 });

    // Global best = top of the leaderboard for this game (excludes bot accounts,
    // matching /api/leaderboard/games). Public — shown to guests too. Cached.
    const global = await getGlobalBest(gameType);

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ best: 0, global });

    const agg = await prisma.attempt.aggregate({
        where: { userId: session.user.id, gameType },
        _max: { score: true },
    });

    return NextResponse.json({ best: agg._max.score ?? 0, global });
}
