'use client';

import { GAME_EMOJI_MAP } from '@/lib/gameConfig';

type GameType = 'QUIZ' | 'UNO' | 'TABOO' | 'SKYJOW' | 'YAHTZEE' | 'PUISSANCE4';

export type GameFilter = GameType | 'ALL';

interface Props {
    value: GameFilter;
    onChange: (value: GameFilter) => void;
    activeClassName?: string;
    inactiveClassName?: string;
    showAll?: boolean;
}

const GAMES: GameFilter[] = ['ALL', 'QUIZ', 'UNO', 'TABOO', 'SKYJOW', 'YAHTZEE', 'PUISSANCE4'];

export default function GameFilterPills({
    value,
    onChange,
    activeClassName = 'bg-red-600 text-white border-red-600',
    inactiveClassName = 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    showAll = true,
}: Props) {
    const games = showAll ? GAMES : GAMES.filter(g => g !== 'ALL');
    return (
        <div className="flex flex-wrap gap-2">
            {games.map((g) => (
                <button
                    key={g}
                    onClick={() => onChange(g)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${value === g ? activeClassName : inactiveClassName}`}
                >
                    {g === 'ALL' ? '🎮 Tous' : `${GAME_EMOJI_MAP[g]} ${g}`}
                </button>
            ))}
        </div>
    );
}
