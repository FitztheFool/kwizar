'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import { GAME_LABEL_MAP } from '@/lib/gameConfig';

/**
 * Noms de jeux avec override admin appliqué.
 * `labelOf(id)` accepte aussi bien une clé GAME_CONFIG (atlantide) qu'une valeur
 * d'enum (ATLANTIDE) : la map renvoyée par /api/games/labels contient les deux.
 * Repli sur les noms statiques tant que la requête n'est pas chargée.
 */
export function useGameLabels() {
    const { data } = useSWR<{ labels: Record<string, string> }>('/api/games/labels', fetcher);
    const overrides = data?.labels;

    const labelOf = (id: string): string =>
        overrides?.[id] ?? GAME_LABEL_MAP[id] ?? id;

    return { labelOf, ready: !!overrides };
}
