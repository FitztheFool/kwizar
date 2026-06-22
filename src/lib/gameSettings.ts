import prisma from '@/lib/prisma';
import { GAME_CONFIG, gameCoverUrl, gameIconUrl, type GameType as GameKey } from '@/lib/gameConfig';

// Le `gameType` Prisma (enum, ex. ATLANTIDE) diffère de la clé de GAME_CONFIG
// (ex. atlantide). On passe de l'un à l'autre via le champ `gameType` des entrées.

/** Valeur d'enum Prisma → clé GAME_CONFIG (ATLANTIDE → atlantide). */
export const GAME_KEY_BY_ENUM = Object.fromEntries(
    Object.entries(GAME_CONFIG).map(([key, g]) => [g.gameType, key as GameKey]),
) as Record<string, GameKey>;

/** Clé GAME_CONFIG → valeur d'enum Prisma (atlantide → ATLANTIDE). */
export const GAME_ENUM_BY_KEY = Object.fromEntries(
    Object.entries(GAME_CONFIG).map(([key, g]) => [key as GameKey, g.gameType]),
) as Record<GameKey, string>;

/** Toutes les valeurs d'enum Prisma connues, dans l'ordre de GAME_CONFIG. */
export const ALL_GAME_ENUMS = Object.values(GAME_CONFIG).map(g => g.gameType as string);

/**
 * Ensemble des clés GAME_CONFIG actuellement activées.
 * Un jeu sans ligne en base est considéré activé (défaut sûr).
 */
export async function getEnabledGameKeys(): Promise<Set<GameKey>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, enabled: true } });
    const disabled = new Set(rows.filter(r => !r.enabled).map(r => r.gameType as string));
    const enabled = new Set<GameKey>();
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        if (!disabled.has(g.gameType)) enabled.add(key as GameKey);
    }
    return enabled;
}

/**
 * Icône carrée effective de chaque jeu : override admin (base) sinon défaut (public/icons/).
 * Map clé GAME_CONFIG → URL (tous les jeux ont une icône). Utilisée dans les lobbys.
 */
export async function getGameImages(): Promise<Record<string, string>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, imageUrl: true } });
    const overrideByEnum = new Map(rows.filter(r => r.imageUrl).map(r => [r.gameType as string, r.imageUrl as string]));
    const out: Record<string, string> = {};
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        out[key] = overrideByEnum.get(g.gameType) ?? gameIconUrl(key);
    }
    return out;
}

/**
 * Bannière paysage effective de chaque jeu : override admin (base) sinon défaut (public/covers/).
 * Map clé GAME_CONFIG → URL (tous les jeux ont une cover). Utilisée sur l'accueil.
 */
export async function getGameCovers(): Promise<Record<string, string>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, coverUrl: true } });
    const overrideByEnum = new Map(rows.filter(r => r.coverUrl).map(r => [r.gameType as string, r.coverUrl as string]));
    const out: Record<string, string> = {};
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        out[key] = overrideByEnum.get(g.gameType) ?? gameCoverUrl(key);
    }
    return out;
}

/**
 * Nom effectif de chaque jeu : override admin (base) sinon `label` du GAME_CONFIG.
 * Indexé à la fois par clé GAME_CONFIG (atlantide) ET par valeur d'enum (ATLANTIDE),
 * pour que tous les consommateurs puissent résoudre le nom quel que soit l'identifiant.
 */
export async function getGameLabels(): Promise<Record<string, string>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, label: true } });
    const overrideByEnum = new Map(rows.filter(r => r.label).map(r => [r.gameType as string, r.label as string]));
    const out: Record<string, string> = {};
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        const label = overrideByEnum.get(g.gameType) ?? g.label;
        out[key] = label;
        out[g.gameType] = label;
    }
    return out;
}

/** Description effective de chaque jeu : override admin (base) sinon `description` du GAME_CONFIG. */
export async function getGameDescriptions(): Promise<Record<string, string>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, description: true } });
    const overrideByEnum = new Map(rows.filter(r => r.description).map(r => [r.gameType as string, r.description as string]));
    const out: Record<string, string> = {};
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        const value = overrideByEnum.get(g.gameType) ?? ('description' in g ? (g.description as string) : undefined);
        if (value) out[key] = value;
    }
    return out;
}

/** Nombre de joueurs effectif de chaque jeu : override admin (base) sinon `players` du GAME_CONFIG. */
export async function getGamePlayers(): Promise<Record<string, string>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, players: true } });
    const overrideByEnum = new Map(rows.filter(r => r.players).map(r => [r.gameType as string, r.players as string]));
    const out: Record<string, string> = {};
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        const value = overrideByEnum.get(g.gameType) ?? ('players' in g ? (g.players as string) : undefined);
        if (value) out[key] = value;
    }
    return out;
}

/**
 * Config effective d'un jeu : GAME_CONFIG fusionné avec les overrides admin (base) pour
 * nom, icône, couverture, description, règles, calcul des points, joueurs et libellé de score.
 * Utilisée par les pages publiques (classement…) pour refléter les modifications admin.
 */
export async function getGameConfig(key: GameKey) {
    const base = GAME_CONFIG[key];
    const enumValue = GAME_ENUM_BY_KEY[key];
    const row = enumValue
        ? await prisma.gameSetting.findUnique({
            where: { gameType: enumValue as never },
            select: { imageUrl: true, coverUrl: true, label: true, description: true, rules: true, score: true, players: true, scoreLabel: true },
        })
        : null;
    const str = (f: string) => (f in base ? ((base as Record<string, unknown>)[f] as string) : undefined);
    return {
        ...base,
        label: row?.label ?? base.label,
        description: row?.description ?? str('description'),
        rules: row?.rules ?? str('rules'),
        score: row?.score ?? str('score'),
        players: row?.players ?? str('players'),
        scoreLabel: row?.scoreLabel ?? str('scoreLabel'),
        image: row?.imageUrl ?? gameIconUrl(key),
        cover_img: row?.coverUrl ?? gameCoverUrl(key),
    };
}

/** Un jeu donné (clé GAME_CONFIG) est-il activé ? */
export async function isGameEnabled(key: GameKey): Promise<boolean> {
    const enumValue = GAME_ENUM_BY_KEY[key];
    if (!enumValue) return false;
    const row = await prisma.gameSetting.findUnique({
        where: { gameType: enumValue as never },
        select: { enabled: true },
    });
    return row ? row.enabled : true;
}
