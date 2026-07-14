'use client';

import { ReactNode } from 'react';
import { gameThemeVars, type GameKey } from '@/lib/theme/games';
import { useGameAccent } from '@/hooks/useGameAccent';

/**
 * En-tête des parties multijoueur — partagé par les 20 pages de jeu.
 *
 * La prop `game` est **obligatoire** : elle pose la couleur du jeu (--game-rgb) sur
 * l'en-tête et le halo du fond (--halo-rgb). Un seul fichier thématise donc les 20
 * pages, sans en éditer aucune.
 */
export default function GamePageHeader({ game, left, center, right }: {
    game: GameKey;
    left: ReactNode;
    center?: ReactNode;
    right?: ReactNode;
}) {
    useGameAccent(game);

    return (
        <header
            style={gameThemeVars(game)}
            // Liseré à la couleur du jeu : discret au repos, il signale de quelle partie
            // il s'agit sans transformer l'en-tête en enseigne lumineuse.
            className="shrink-0 h-14 border-b border-game/25 bg-white/70 dark:bg-stone-950/70 backdrop-blur-xl text-gray-900 dark:text-white px-3 sm:px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4"
        >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                {left}
            </div>
            <div className="flex justify-center items-center gap-2">
                {center}
            </div>
            <div className="flex justify-end items-center gap-2 min-w-0 overflow-hidden">
                {right}
            </div>
        </header>
    );
}
