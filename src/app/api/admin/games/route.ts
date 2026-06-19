import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { GAME_CONFIG, type GameType as GameKey } from '@/lib/gameConfig';
import { GAME_ENUM_BY_KEY, ALL_GAME_ENUMS } from '@/lib/gameSettings';

// Liste des jeux avec leur état activé/désactivé (admin uniquement).
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, enabled: true } });
    const enabledByEnum = new Map(rows.map(r => [r.gameType as string, r.enabled]));

    const games = Object.entries(GAME_CONFIG).map(([key, g]) => ({
        key,
        gameType: g.gameType as string,
        label: g.label,
        mode: g.mode,
        image: 'image' in g ? (g.image as string) : null,
        // Pas de ligne = activé par défaut.
        enabled: enabledByEnum.get(g.gameType) ?? true,
    }));

    return NextResponse.json({ games });
}

// Active ou désactive un jeu.
export async function PATCH(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    let body: { key?: string; enabled?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
    }

    const { key, enabled } = body;
    if (typeof key !== 'string' || typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const enumValue = GAME_ENUM_BY_KEY[key as GameKey];
    if (!enumValue || !ALL_GAME_ENUMS.includes(enumValue)) {
        return NextResponse.json({ error: 'Jeu inconnu' }, { status: 404 });
    }

    await prisma.gameSetting.upsert({
        where: { gameType: enumValue as never },
        update: { enabled },
        create: { gameType: enumValue as never, enabled },
    });

    return NextResponse.json({ ok: true, key, enabled });
}
