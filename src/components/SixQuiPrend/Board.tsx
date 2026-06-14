'use client';

import type { SixState } from '@/hooks/useSixQuiPrend';

// têtes de bœuf (miroir serveur)
export const heads = (c: number): number =>
    c === 55 ? 7 : c % 11 === 0 ? 5 : c % 10 === 0 ? 3 : c % 5 === 0 ? 2 : 1;

const headStyle = (h: number): string =>
    h >= 7 ? 'bg-purple-600 text-white'
        : h === 5 ? 'bg-red-600 text-white'
            : h === 3 ? 'bg-orange-500 text-white'
                : h === 2 ? 'bg-amber-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-100';

export function Card({ n, size = 'md', dim = false, selected = false }: { n: number; size?: 'sm' | 'md'; dim?: boolean; selected?: boolean }) {
    const h = heads(n);
    const w = size === 'sm' ? 'w-9 h-12 text-sm' : 'w-11 h-16 text-base';
    return (
        <div className={`relative ${w} rounded-lg border-2 flex items-center justify-center font-black shadow-sm transition-all
            ${selected ? 'border-rose-500 ring-2 ring-rose-400 -translate-y-1' : 'border-gray-200 dark:border-gray-700'}
            ${dim ? 'opacity-40' : ''}
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}>
            {n}
            <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${headStyle(h)}`}>
                {h}
            </span>
        </div>
    );
}

interface Props {
    state: SixState;
    onChooseCard: (card: number) => void;
    onChooseRow: (row: number) => void;
}

export default function SixBoard({ state, onChooseCard, onChooseRow }: Props) {
    const myChooseRow = state.phase === 'choosingRow' && state.chooser === state.myColorIndex;
    const locked = state.mySelected !== null;
    const reveal = state.phase !== 'selecting' && state.lastReveals.length > 0;

    const nameOf = (ci: number) => state.players.find(p => p.colorIndex === ci)?.username ?? '?';

    return (
        <div className="w-full max-w-2xl flex flex-col gap-4">
            {/* Rangées */}
            <div className="flex flex-col gap-2 bg-white/60 dark:bg-zinc-900/50 rounded-2xl p-3 ring-1 ring-black/5">
                {state.rows.map((row, r) => {
                    const takeable = myChooseRow;
                    return (
                        <button
                            key={r}
                            disabled={!takeable}
                            onClick={() => takeable && onChooseRow(r)}
                            className={`flex items-center gap-1.5 rounded-xl p-1.5 transition-all
                                ${takeable ? 'cursor-pointer hover:bg-rose-500/10 ring-2 ring-rose-400/50' : 'cursor-default'}
                                ${state.lastTakenRow === r ? 'bg-amber-400/15' : ''}`}
                        >
                            <span className="w-5 text-[10px] font-bold text-gray-400 shrink-0">R{r + 1}</span>
                            <div className="flex gap-1 flex-1">
                                {row.map((c, i) => <Card key={i} n={c} size="sm" />)}
                                {Array.from({ length: 5 - row.length }).map((_, i) => (
                                    <div key={`e${i}`} className="w-9 h-12 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700/50" />
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {myChooseRow && (
                <p className="text-center text-sm font-semibold text-rose-600 dark:text-rose-400">
                    Ta carte est trop basse — choisis une rangée à ramasser (clique-la).
                </p>
            )}
            {state.phase === 'choosingRow' && !myChooseRow && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {nameOf(state.chooser ?? 0)} ramasse une rangée…
                </p>
            )}

            {/* Révélation des cartes jouées */}
            {reveal && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {[...state.lastReveals].sort((a, b) => a.card - b.card).map(rv => (
                        <div key={rv.colorIndex} className="flex flex-col items-center gap-0.5">
                            <Card n={rv.card} size="sm" />
                            <span className="text-[9px] text-gray-400 max-w-[3.5rem] truncate">{nameOf(rv.colorIndex)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Ma main */}
            {state.myHand.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Ta main</span>
                        <span className="text-[11px] text-gray-400">
                            {locked ? 'Carte jouée — en attente des autres…' : state.phase === 'selecting' ? 'Choisis une carte' : ''}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center bg-black/5 dark:bg-white/5 rounded-xl p-2">
                        {state.myHand.map(n => (
                            <button
                                key={n}
                                disabled={locked || state.phase !== 'selecting'}
                                onClick={() => onChooseCard(n)}
                                className={`transition-transform ${locked || state.phase !== 'selecting' ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1'}`}
                            >
                                <Card n={n} selected={state.mySelected === n} dim={locked && state.mySelected !== n} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
