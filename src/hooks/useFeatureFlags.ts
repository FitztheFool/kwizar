'use client';

import { useEffect, useState } from 'react';

export interface FeatureFlags {
    friends: boolean;
    messages: boolean;
    sidebarSearch: boolean;
}

const DEFAULTS: FeatureFlags = { friends: true, messages: true, sidebarSearch: true };

// Drapeaux globaux mémorisés entre montages.
let cached: FeatureFlags | null = null;
const listeners = new Set<(v: FeatureFlags) => void>();
let fetched = false;

function load() {
    if (fetched) return;
    fetched = true;
    fetch('/api/settings/features')
        .then(r => r.ok ? r.json() : DEFAULTS)
        .then((d: Partial<FeatureFlags>) => {
            cached = { friends: d?.friends !== false, messages: d?.messages !== false, sidebarSearch: d?.sidebarSearch !== false };
            listeners.forEach(l => l(cached!));
        })
        .catch(() => { cached = DEFAULTS; listeners.forEach(l => l(DEFAULTS)); });
}

/** Tout est considéré activé tant que la valeur n'est pas chargée. */
export function useFeatureFlags(): FeatureFlags {
    const [flags, setFlags] = useState<FeatureFlags>(cached ?? DEFAULTS);
    useEffect(() => {
        listeners.add(setFlags);
        if (cached !== null) setFlags(cached);
        else load();
        return () => { listeners.delete(setFlags); };
    }, []);
    return flags;
}

/** MAJ du cache + notification live après un toggle admin. */
export function setFeatureFlagCache(key: keyof FeatureFlags, value: boolean) {
    cached = { ...(cached ?? DEFAULTS), [key]: value };
    fetched = true;
    listeners.forEach(l => l(cached!));
}
