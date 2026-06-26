import prisma from '@/lib/prisma';
import { GAME_CONFIG } from '@/lib/gameConfig';

// Drapeaux de fonctionnalités globaux (clé/valeur en base, défaut = activé).
export const FEATURE_KEYS = ['friends', 'messages', 'sidebarSearch'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

// ── Jeux en tendances (carrousel d'accueil) ──────────────────────────────────
const TRENDING_KEY = 'trendingGames';
export const DEFAULT_TRENDING_GAMES = ['duel', 'atlantide', 'abalone', 'taboo'];

const isValidGameKey = (k: string): boolean => Object.prototype.hasOwnProperty.call(GAME_CONFIG, k);

/** Liste ordonnée des clés de jeux en tendances (défaut si non configuré). */
export async function getTrendingGames(): Promise<string[]> {
    const row = await prisma.appSetting.findUnique({ where: { key: TRENDING_KEY }, select: { value: true } });
    if (!row) return DEFAULT_TRENDING_GAMES.filter(isValidGameKey);
    try {
        const arr = JSON.parse(row.value);
        if (!Array.isArray(arr)) return DEFAULT_TRENDING_GAMES.filter(isValidGameKey);
        return arr.filter((k): k is string => typeof k === 'string' && isValidGameKey(k));
    } catch {
        return DEFAULT_TRENDING_GAMES.filter(isValidGameKey);
    }
}

/** Remplace la liste des jeux en tendances (clés invalides ignorées, dédupliquées). */
export async function setTrendingGames(keys: string[]): Promise<string[]> {
    const clean = [...new Set(keys.filter(isValidGameKey))];
    await prisma.appSetting.upsert({
        where: { key: TRENDING_KEY },
        update: { value: JSON.stringify(clean) },
        create: { key: TRENDING_KEY, value: JSON.stringify(clean) },
    });
    return clean;
}

async function getBoolSetting(key: string, fallback = true): Promise<boolean> {
    const row = await prisma.appSetting.findUnique({ where: { key }, select: { value: true } });
    if (!row) return fallback;
    return row.value === 'true';
}

async function setBoolSetting(key: string, value: boolean): Promise<void> {
    await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
    });
}

/** État de tous les drapeaux (absence en base = activé). */
export async function getFeatureFlags(): Promise<Record<FeatureKey, boolean>> {
    const rows = await prisma.appSetting.findMany({
        where: { key: { in: FEATURE_KEYS as unknown as string[] } },
        select: { key: true, value: true },
    });
    const byKey = new Map(rows.map(r => [r.key, r.value === 'true']));
    return {
        friends: byKey.get('friends') ?? true,
        messages: byKey.get('messages') ?? true,
        sidebarSearch: byKey.get('sidebarSearch') ?? true,
    };
}

export function isFeatureEnabled(key: FeatureKey): Promise<boolean> {
    return getBoolSetting(key, true);
}

export function setFeatureEnabled(key: FeatureKey, enabled: boolean): Promise<void> {
    return setBoolSetting(key, enabled);
}
