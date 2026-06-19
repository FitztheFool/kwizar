import prisma from '@/lib/prisma';

// Drapeaux de fonctionnalités globaux (clé/valeur en base, défaut = activé).
export const FEATURE_KEYS = ['friends', 'messages', 'sidebarSearch'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

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
