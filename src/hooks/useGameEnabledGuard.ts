'use client';

import { useEffect, useState } from 'react';
import type { GameType } from '@/lib/gameConfig';

type GuardState = 'checking' | 'enabled' | 'disabled';

// Cache module-level partagé entre pages : on ne refetch pas la liste à chaque navigation.
let enabledCache: Set<string> | null = null;
let inflight: Promise<Set<string> | null> | null = null;

async function fetchEnabled(): Promise<Set<string> | null> {
    if (enabledCache) return enabledCache;
    if (inflight) return inflight;
    inflight = fetch('/api/games/enabled')
        .then(r => (r.ok ? r.json() : null))
        .then((d: { enabled: string[] } | null) => {
            if (!d?.enabled) return null;
            enabledCache = new Set(d.enabled);
            return enabledCache;
        })
        .catch(() => null)
        .finally(() => { inflight = null; });
    return inflight;
}

/**
 * Garde côté page de jeu : empêche l'accès direct (URL) à un jeu désactivé par l'admin.
 * Tant que la vérification n'est pas faite (ou échoue), on n'empêche rien.
 */
export function useGameEnabledGuard(gameKey: GameType): GuardState {
    const [state, setState] = useState<GuardState>(enabledCache
        ? (enabledCache.has(gameKey) ? 'enabled' : 'disabled')
        : 'checking');

    useEffect(() => {
        let active = true;
        fetchEnabled().then(set => {
            if (!active) return;
            if (!set) { setState('enabled'); return; } // impossible de vérifier → on laisse passer
            setState(set.has(gameKey) ? 'enabled' : 'disabled');
        });
        return () => { active = false; };
    }, [gameKey]);

    return state;
}
