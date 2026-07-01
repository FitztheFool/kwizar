// src/app/api/leaderboard/games/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardData } from '@/lib/leaderboard';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const game = searchParams.get('game') ?? '';
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '20');

        const data = await getLeaderboardData(game, page, limit);
        if (!data) return NextResponse.json({ error: 'Jeu invalide' }, { status: 400 });

        return NextResponse.json(data);
    } catch (error) {
        console.error('[GET /api/leaderboard/games]', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
