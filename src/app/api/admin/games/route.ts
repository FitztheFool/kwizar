import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { GAME_CONFIG, type GameType as GameKey } from '@/lib/gameConfig';
import { GAME_ENUM_BY_KEY, ALL_GAME_ENUMS } from '@/lib/gameSettings';

// Liste des jeux avec leur état activé/désactivé (admin uniquement).
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, enabled: true, imageUrl: true } });
    const byEnum = new Map(rows.map(r => [r.gameType as string, r]));

    const games = Object.entries(GAME_CONFIG).map(([key, g]) => {
        const row = byEnum.get(g.gameType);
        const defaultImage = 'image' in g ? (g.image as string) : null;
        return {
            key,
            gameType: g.gameType as string,
            label: g.label,
            mode: g.mode,
            defaultImage,
            // Image effective : override admin sinon défaut config.
            image: row?.imageUrl ?? defaultImage,
            // Vrai si une image custom a été définie en base.
            hasCustomImage: !!row?.imageUrl,
            // Pas de ligne = activé par défaut.
            enabled: row?.enabled ?? true,
        };
    });

    return NextResponse.json({ games });
}

// Met à jour un jeu : activation et/ou image (admin uniquement).
export async function PATCH(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    let body: { key?: string; enabled?: boolean; imageUrl?: string | null };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
    }

    const { key, enabled, imageUrl } = body;
    if (typeof key !== 'string') {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    const hasEnabled = typeof enabled === 'boolean';
    const hasImage = imageUrl !== undefined; // null = réinitialiser à l'image par défaut
    if (!hasEnabled && !hasImage) {
        return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });
    }

    const enumValue = GAME_ENUM_BY_KEY[key as GameKey];
    if (!enumValue || !ALL_GAME_ENUMS.includes(enumValue)) {
        return NextResponse.json({ error: 'Jeu inconnu' }, { status: 404 });
    }

    const update: { enabled?: boolean; imageUrl?: string | null } = {};
    if (hasEnabled) update.enabled = enabled;
    if (hasImage) update.imageUrl = imageUrl || null;

    await prisma.gameSetting.upsert({
        where: { gameType: enumValue as never },
        update,
        create: { gameType: enumValue as never, enabled: enabled ?? true, imageUrl: imageUrl || null },
    });

    return NextResponse.json({ ok: true, key, ...update });
}
