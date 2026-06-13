// src/components/EloOverview.tsx
'use client';
import { GAME_LABEL_MAP } from '@/lib/gameConfig';
import { GAME_COLOR } from '@/lib/gameColor';
import GameIcon from '@/components/GameIcon';
import { TrophyIcon } from '@heroicons/react/24/solid';

interface GameStat {
    elo?: number | null;
    eloGames?: number;
    eloPeak?: number;
}

interface Props {
    gameStats: Record<string, GameStat>;
    eloRanks?: Record<string, number>;
}

function rankChip(rank: number) {
    const cls =
        rank === 1 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300'
            : rank === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                : rank === 3 ? 'bg-orange-700 text-orange-50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
    return (
        <span className={`shrink-0 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-[11px] font-bold ${cls}`}>
            #{rank}
        </span>
    );
}

/** Panneau récap des notes ELO du joueur : meilleurs jeux, ELO moyen, record. */
export default function EloOverview({ gameStats, eloRanks = {} }: Props) {
    const rated = Object.entries(gameStats)
        .filter(([, s]) => s.elo != null && (s.eloGames ?? 0) > 0)
        .map(([type, s]) => ({
            type,
            elo: s.elo as number,
            games: s.eloGames ?? 0,
            peak: s.eloPeak ?? (s.elo as number),
            rank: eloRanks[type],
        }))
        .sort((a, b) => b.elo - a.elo);

    if (rated.length === 0) return null;

    const avg = Math.round(rated.reduce((sum, r) => sum + r.elo, 0) / rated.length);
    const peakBest = Math.max(...rated.map(r => r.peak));

    return (
        <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-white">
                    Niveau ELO
                </h2>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>ELO moyen <b className="text-sm text-indigo-600 dark:text-indigo-300">{avg}</b></span>
                    <span>Record <b className="text-sm text-amber-600 dark:text-amber-300">{peakBest}</b></span>
                    <span>{rated.length} jeu{rated.length > 1 ? 'x' : ''}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {rated.map((r, i) => {
                    const c = GAME_COLOR[r.type]?.card;
                    return (
                        <div
                            key={r.type}
                            className={`relative rounded-xl border p-3 ${c?.border ?? 'border-gray-200 dark:border-gray-700'} ${c?.bg ?? 'bg-gray-50 dark:bg-gray-800/50'}`}
                        >
                            {i === 0 && (
                                <TrophyIcon className="absolute top-2 right-2 w-4 h-4 text-amber-400" />
                            )}
                            <div className="flex items-center gap-1.5 mb-2 min-w-0 pr-4">
                                <GameIcon gameType={r.type} className="w-3.5 h-3.5 shrink-0" />
                                <span className={`text-[10px] font-bold uppercase tracking-wide truncate ${c?.label ?? 'text-gray-600 dark:text-gray-400'}`}>
                                    {GAME_LABEL_MAP[r.type] ?? r.type}
                                </span>
                            </div>
                            <div className="flex items-end justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{r.elo}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-300">ELO</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                                        record {r.peak} · {r.games} partie{r.games > 1 ? 's' : ''}
                                    </div>
                                </div>
                                {r.rank ? rankChip(r.rank) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
