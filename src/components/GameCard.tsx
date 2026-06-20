'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
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

const MODE_GLOW: Record<GameMode, string> = {
    solo: 'hover:shadow-glow',
    both: 'hover:shadow-[0_8px_30px_-8px_rgba(180,84,65,0.45)]',
    multi: 'hover:shadow-glow-felt',
};
const MODE_ICON: Record<GameMode, string> = {
    solo: 'text-primary-400',
    both: 'text-clay-400',
    multi: 'text-felt-400',
};

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
    // Image effective : override admin (base) sinon défaut config. SWR partagé → 1 requête.
    const { data: imagesData } = useSWR<{ images: Record<string, string> }>('/api/games/images', fetcher);
    const defaultImage = 'image' in g ? (g.image as string) : null;
    const image = imagesData?.images?.[gameKey] ?? defaultImage;
    // Nom effectif : override admin sinon défaut config.
    const { data: labelsData } = useSWR<{ labels: Record<string, string> }>('/api/games/labels', fetcher);
    const label = labelsData?.labels?.[gameKey] ?? g.label;
    const [lobbyCode] = useState(() => crypto.randomUUID());

    return (
        <div
            className={cn(
                'glass flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5',
                MODE_GLOW[mode],
            )}
        >
            {image && (
                <Link href={`/leaderboard/${gameKey}`} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={label} className="h-28 w-full object-cover" draggable={false} />
                </Link>
            )}
            <div className="flex flex-1 flex-col p-4">
            <Link href={`/leaderboard/${gameKey}`} className="block min-w-0 flex-1">
                {!image && (
                    <span className={cn('mb-2 block', MODE_ICON[mode])}>
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
                {mode === 'solo' ? (
                    <Link href={`/game/${gameKey}`} className={ACTION_PRIMARY}>
                        Jouer
                    </Link>
                ) : (
                    <div className="flex gap-1.5">
                        <Link href={`/lobby/all?game=${gameKey}`} className={ACTION_GHOST}>
                            Rejoindre
                        </Link>
                        <Link href={`/lobby/create/${lobbyCode}?game=${gameKey}`} className={ACTION_PRIMARY}>
                            Créer
                        </Link>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
