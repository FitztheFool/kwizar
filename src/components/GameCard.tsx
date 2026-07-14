'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { GAME_CONFIG, gameCoverUrl, type GameMode } from '@/lib/gameConfig';
import { gameThemeVars, type GameKey } from '@/lib/theme/games';
import GameIcon from '@/components/GameIcon';
import { fetcher } from '@/lib/swr';
import { cn } from '@/lib/cn';

// ── Helpers ───────────────────────────────────────────────────────────────────

function PersonIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

// « Jouer »/« Créer » est une ACTION, pas une identité de jeu : sur une grille de 34
// cartes, un bouton par couleur de jeu vire au sapin de Noël. L'action garde donc
// l'accent de marque, uniforme partout. La couleur du jeu reste sur ce qui l'identifie
// vraiment : le halo de la carte au survol et l'icône.
const ACTION_PRIMARY =
    'rounded-lg px-2.5 py-1 text-[11px] font-bold text-white bg-accent-gradient hover:brightness-110 transition active:scale-95';
const ACTION_GHOST =
    'rounded-lg px-2.5 py-1 text-[11px] font-bold glass text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/[0.08] transition active:scale-95';

// ── Component ─────────────────────────────────────────────────────────────────

interface GameCardProps {
    gameKey: string;
    mode: GameMode;
}

export default function GameCard({ gameKey, mode }: GameCardProps) {
    const g = GAME_CONFIG[gameKey as keyof typeof GAME_CONFIG];
    // Cover effective : override admin (base) sinon défaut public/covers/. SWR partagé → 1 requête.
    const { data: coversData } = useSWR<{ covers: Record<string, string> }>('/api/games/covers', fetcher);
    const image = coversData?.covers?.[gameKey] ?? gameCoverUrl(gameKey);
    // Nom effectif : override admin sinon défaut config.
    const { data: labelsData } = useSWR<{ labels: Record<string, string> }>('/api/games/labels', fetcher);
    const label = labelsData?.labels?.[gameKey] ?? g.label;
    const [lobbyCode] = useState(() => crypto.randomUUID());

    return (
        <div
            // --game-rgb descend par la cascade : tous les `*-game` de la carte
            // (glow, icône, bouton) résolvent vers la couleur de CE jeu.
            style={gameThemeVars(gameKey as GameKey)}
            className={cn(
                'glass flex flex-col overflow-hidden rounded-2xl transition-all duration-200',
                // Néon au survol seulement : la carte au repos reste mate.
                'hover:-translate-y-0.5 hover:shadow-game-glow hover:border-game/30',
            )}
        >
            {image && (
                <Link href={`/leaderboard/${gameKey}`} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={label} loading="lazy" decoding="async" className="h-28 w-full object-cover" draggable={false} />
                </Link>
            )}
            <div className="flex flex-1 flex-col p-4">
            <Link href={`/leaderboard/${gameKey}`} className="block min-w-0 flex-1">
                {!image && (
                    <span className="mb-2 block text-game">
                        <GameIcon gameType={g.gameType} className="h-8 w-8" />
                    </span>
                )}
                <h4 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">{label}</h4>
                <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{g.description}</div>
            </Link>
            <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
                <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                    <PersonIcon /> {g.players}
                </span>
                <div className="flex gap-1.5">
                    <Link href={`/leaderboard/${gameKey}`} className={ACTION_GHOST} title="Règles et classement">
                        Règles
                    </Link>
                    {mode === 'solo' ? (
                        <Link href={`/game/${gameKey}`} className={ACTION_PRIMARY}>
                            Jouer
                        </Link>
                    ) : (
                        <>
                            <Link href={`/lobby/all?game=${gameKey}`} className={ACTION_GHOST}>
                                Rejoindre
                            </Link>
                            <Link href={`/lobby/create/${lobbyCode}?game=${gameKey}`} className={ACTION_PRIMARY}>
                                Créer
                            </Link>
                        </>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
