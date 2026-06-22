import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { GAME_CONFIG, gameIconUrl, gameCoverUrl, type GameType as GameKey } from '@/lib/gameConfig';
import { GAME_ENUM_BY_KEY, ALL_GAME_ENUMS } from '@/lib/gameSettings';

// Champs de contenu surchargeables par l'admin (override en base sinon défaut config).
const OVERRIDE_FIELDS = ['imageUrl', 'coverUrl', 'label', 'description', 'rules', 'score', 'players', 'scoreLabel'] as const;

// Liste des jeux avec leurs valeurs effectives + défauts + drapeaux « custom » (admin uniquement).
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const rows = await prisma.gameSetting.findMany();
    const byEnum = new Map(rows.map(r => [r.gameType as string, r]));

    const games = Object.entries(GAME_CONFIG).map(([key, g]) => {
        const row = byEnum.get(g.gameType);
        const str = (f: string) => (f in g ? ((g as Record<string, unknown>)[f] as string) : '');
        const defaultImage = gameIconUrl(key);
        const defaultCover = gameCoverUrl(key);
        return {
            key,
            gameType: g.gameType as string,
            mode: g.mode,
            bot: 'bot' in g ? !!g.bot : false,
            // Pas de ligne = activé par défaut.
            enabled: row?.enabled ?? true,

            // Chaque champ : valeur effective (override sinon défaut), défaut, et drapeau « override défini ».
            label: row?.label ?? g.label,
            defaultLabel: g.label,
            hasCustomLabel: !!row?.label,

            image: row?.imageUrl ?? defaultImage, // icône carrée (lobby)
            defaultImage,
            hasCustomImage: !!row?.imageUrl,

            cover: row?.coverUrl ?? defaultCover, // bannière paysage (accueil)
            defaultCover,
            hasCustomCover: !!row?.coverUrl,

            description: row?.description ?? str('description'),
            defaultDescription: str('description'),
            hasCustomDescription: !!row?.description,

            rules: row?.rules ?? str('rules'),
            defaultRules: str('rules'),
            hasCustomRules: !!row?.rules,

            score: row?.score ?? str('score'),
            defaultScore: str('score'),
            hasCustomScore: !!row?.score,

            players: row?.players ?? str('players'),
            defaultPlayers: str('players'),
            hasCustomPlayers: !!row?.players,

            scoreLabel: row?.scoreLabel ?? str('scoreLabel'),
            defaultScoreLabel: str('scoreLabel'),
            hasCustomScoreLabel: !!row?.scoreLabel,
        };
    });

    return NextResponse.json({ games });
}

// Met à jour un jeu : activation + champs de contenu (admin uniquement).
// Pour chaque champ : undefined = inchangé, null/"" = réinitialiser au défaut config.
export async function PATCH(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    let body: Partial<Record<typeof OVERRIDE_FIELDS[number] | 'key' | 'enabled', string | boolean | null>>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
    }

    const { key, enabled } = body;
    if (typeof key !== 'string') {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const enumValue = GAME_ENUM_BY_KEY[key as GameKey];
    if (!enumValue || !ALL_GAME_ENUMS.includes(enumValue)) {
        return NextResponse.json({ error: 'Jeu inconnu' }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (typeof enabled === 'boolean') update.enabled = enabled;
    for (const field of OVERRIDE_FIELDS) {
        const value = body[field];
        if (value !== undefined) update[field] = (typeof value === 'string' ? value.trim() : '') || null;
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });
    }

    await prisma.gameSetting.upsert({
        where: { gameType: enumValue as never },
        update,
        create: { gameType: enumValue as never, enabled: typeof enabled === 'boolean' ? enabled : true, ...update },
    });

    return NextResponse.json({ ok: true, key, ...update });
}
