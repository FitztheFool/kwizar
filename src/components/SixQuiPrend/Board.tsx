'use client';

import type { SixState } from '@/hooks/useSixQuiPrend';

// têtes de bœuf (miroir serveur)
export const heads = (c: number): number =>
    c === 55 ? 7 : c % 11 === 0 ? 5 : c % 10 === 0 ? 3 : c % 5 === 0 ? 2 : 1;

// bandeau de couleur par sévérité (1 → 7 têtes)
const severity = (h: number): { band: string; text: string } =>
    h >= 7 ? { band: 'bg-purple-600', text: 'text-purple-700 dark:text-purple-300' }
        : h === 5 ? { band: 'bg-red-600', text: 'text-red-700 dark:text-red-300' }
            : h === 3 ? { band: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300' }
                : h === 2 ? { band: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' }
                    : { band: 'bg-gray-300 dark:bg-gray-600', text: 'text-gray-500 dark:text-gray-400' };

/** Tête de bœuf stylisée (rouge). */
function BullHead({ className = 'w-3 h-3' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 22" className={className} fill="currentColor">
            <path d="M3 2c2.5 1 4 3 4.5 5.2C9 6.4 10.4 6 12 6s3 .4 4.5 1.2C17 5 18.5 3 21 2c.7 2.8.2 5.4-1.4 7.4 1 1.2 1.6 2.7 1.6 4.4 0 4-3.6 6.2-9.2 6.2S2.8 17.8 2.8 13.8c0-1.7.6-3.2 1.6-4.4C2.8 7.4 2.3 4.8 3 2Z" />
            <circle cx="9.2" cy="13" r="1.1" fill="#fff" />
            <circle cx="14.8" cy="13" r="1.1" fill="#fff" />
        </svg>
    );
}

export function Card({ n, size = 'md', dim = false, selected = false }: { n: number; size?: 'sm' | 'md'; dim?: boolean; selected?: boolean }) {
    const h = heads(n);
    const sev = severity(h);
    const dims = size === 'sm' ? 'w-10 h-14' : 'w-12 h-[4.6rem]';
    const num = size === 'sm' ? 'text-base' : 'text-xl';
    return (
        <div className={`relative ${dims} rounded-lg overflow-hidden flex flex-col bg-white dark:bg-zinc-100 shadow-md transition-all
            border ${selected ? 'ring-2 ring-rose-500 border-rose-400 -translate-y-1.5 shadow-lg' : 'border-black/10'}
            ${dim ? 'opacity-40' : ''}`}>
            {/* bandeau de sévérité */}
            <div className={`h-1 w-full shrink-0 ${sev.band}`} />
            {/* nombre */}
            <div className={`flex-1 flex items-center justify-center font-black ${num} text-zinc-900`}>{n}</div>
            {/* têtes de bœuf */}
            <div className="flex items-center justify-center gap-0.5 pb-1 text-red-600">
                {h <= 3
                    ? Array.from({ length: h }).map((_, i) => <BullHead key={i} className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />)
                    : <span className="flex items-center gap-0.5 font-black text-[10px] leading-none"><BullHead className="w-3 h-3" />×{h}</span>}
            </div>
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
                                    <div key={`e${i}`} className="w-10 h-14 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700/50" />
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
