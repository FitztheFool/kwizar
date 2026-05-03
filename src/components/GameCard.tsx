'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
import GameIcon from '@/components/GameIcon';

// ── Helpers ───────────────────────────────────────────────────────────────────

function PersonIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

const MODE_STYLES = {
    solo: { accent: 'border-l-blue-400' },
    both: { accent: 'border-l-purple-400' },
    multi: { accent: 'border-l-emerald-400' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface GameCardProps {
    gameKey: string;
    mode: GameMode;
}

export default function GameCard({ gameKey, mode }: GameCardProps) {
    const g = GAME_CONFIG[gameKey as keyof typeof GAME_CONFIG];
    const { accent } = MODE_STYLES[mode];
    const [lobbyCode] = useState(() => crypto.randomUUID());

    return (
        <div className={`
            flex flex-col
            bg-white dark:bg-gray-900
            border border-gray-100 dark:border-gray-800 border-l-2 ${accent}
            rounded-xl p-4
            hover:border-gray-200 dark:hover:border-gray-700 hover:-translate-y-0.5
            transition-all duration-150
        `}>
            <Link href={`/leaderboard/${gameKey}`} className="flex-1 min-w-0 block">
                <span className="text-gray-700 dark:text-gray-300 mb-2 block">
                    <GameIcon gameType={g.gameType} className="w-8 h-8" />
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">{g.label}</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{g.description}</div>
            </Link>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                    <PersonIcon /> {g.players}
                </span>
                {mode === 'solo' ? (
                    <Link href={`/game/${gameKey}`}
                        className="text-[11px] font-bold px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
                        Jouer
                    </Link>
                ) : (
                    <div className="flex gap-1.5">
                        <Link href={`/lobby/all?game=${gameKey}`}
                            className="text-[11px] font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                            Rejoindre
                        </Link>
                        <Link href={`/lobby/create/${lobbyCode}?game=${gameKey}`}
                            className="text-[11px] font-bold px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                            Créer
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
