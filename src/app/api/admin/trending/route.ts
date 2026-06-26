import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getTrendingGames, setTrendingGames } from '@/lib/appSettings';

// Gestion admin des jeux en tendances (carrousel d'accueil).
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;
    return NextResponse.json({ games: await getTrendingGames() });
}

export async function PUT(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    let body: { games?: unknown };
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corps invalide' }, { status: 400 }); }
    if (!Array.isArray(body.games)) return NextResponse.json({ error: 'games doit être un tableau' }, { status: 400 });

    const games = await setTrendingGames(body.games.filter((k): k is string => typeof k === 'string'));
    return NextResponse.json({ games });
}
