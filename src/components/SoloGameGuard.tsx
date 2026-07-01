'use client';

import { usePathname } from 'next/navigation';
import { GAME_CONFIG, type GameType } from '@/lib/gameConfig';
import { useGameEnabledGuard } from '@/hooks/useGameEnabledGuard';
import GameUnavailable from '@/components/GameUnavailable';

/**
 * Garde commune aux jeux solo (routes /game/*) : bloque l'accès direct par URL à un
 * jeu désactivé par l'admin. La clé du jeu est dérivée du 1er segment après /game/
 * (ex. /game/snake → snake, /game/duel/create → duel).
 */
export default function SoloGameGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const seg = pathname?.split('/')[2] ?? '';
    const isGame = seg in GAME_CONFIG;
    // Le hook doit être appelé sans condition ; clé bidon inoffensive hors page de jeu.
    const state = useGameEnabledGuard((isGame ? seg : 'snake') as GameType);

    if (isGame && state === 'disabled') return <GameUnavailable />;
    return <>{children}</>;
}
