import prisma from '@/lib/prisma';
import { GAME_CONFIG, type GameType as GameKey } from '@/lib/gameConfig';

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
 * Image effective de chaque jeu : override admin (base) sinon `image` du GAME_CONFIG.
 * Map clé GAME_CONFIG → URL (uniquement les jeux qui ont une image).
 */
export async function getGameImages(): Promise<Record<string, string>> {
    const rows = await prisma.gameSetting.findMany({ select: { gameType: true, imageUrl: true } });
    const overrideByEnum = new Map(rows.filter(r => r.imageUrl).map(r => [r.gameType as string, r.imageUrl as string]));
    const out: Record<string, string> = {};
    for (const [key, g] of Object.entries(GAME_CONFIG)) {
        const override = overrideByEnum.get(g.gameType);
        const fallback = 'image' in g ? (g.image as string) : undefined;
        const url = override ?? fallback;
        if (url) out[key] = url;
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
