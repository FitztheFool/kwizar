// src/components/GameFilterPills.tsx
// Sélecteur single-select d'un jeu pour classement / admin#stats / profil.
// Fine couche au-dessus de GameCombobox (composant unique partagé). API conservée
// en espace `gameType` (ALL inclus) pour ne pas toucher les appelants.
'use client';

import { useMemo } from 'react';
import { GAME_CONFIG } from '@/lib/gameConfig';
import GameCombobox, { type GameOption } from '@/components/GameCombobox';

export type GameFilter = typeof GAME_CONFIG[keyof typeof GAME_CONFIG]['gameType'] | 'ALL';

const ALL_OPTIONS: (GameOption & { gameType: string })[] = Object.entries(GAME_CONFIG)
    .map(([key, g]) => ({ key, label: g.label, gameType: g.gameType }));

interface Props {
    value: GameFilter;
    onChange: (value: GameFilter) => void;
    showAll?: boolean;
    allowedGameTypes?: string[];
}

export default function GameFilterPills({ value, onChange, showAll = true, allowedGameTypes }: Props) {
    const options = useMemo(
        () => (allowedGameTypes ? ALL_OPTIONS.filter(o => allowedGameTypes.includes(o.gameType)) : ALL_OPTIONS),
        [allowedGameTypes],
    );
    // value est un gameType ; GameCombobox travaille en clés → conversion aller/retour.
    const selectedKey = value === 'ALL' ? 'ALL' : (ALL_OPTIONS.find(o => o.gameType === value)?.key ?? null);
    const handle = (key: string) =>
        onChange(key === 'ALL' ? 'ALL' : (ALL_OPTIONS.find(o => o.key === key)?.gameType as GameFilter));

    return (
        <GameCombobox
            options={options}
            value={selectedKey}
            onSelect={handle}
            showAll={showAll}
            optionTrailing="check"
            displaySelected
            className="inline-block w-full max-w-xs align-top"
        />
    );
}
