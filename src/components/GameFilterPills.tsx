// src/components/GameFilterPills.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CONFIG } from '@/lib/gameConfig';
import GameIcon from '@/components/GameIcon';
import { RectangleGroupIcon, ChevronUpDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

export type GameFilter = typeof GAME_CONFIG[keyof typeof GAME_CONFIG]['gameType'] | 'ALL';

interface Props {
    value: GameFilter;
    onChange: (value: GameFilter) => void;
    /** Conservé pour compat : classes du bouton déclencheur quand une sélection est active. */
    activeClassName?: string;
    /** Conservé pour compat (non utilisé dans le combobox). */
    inactiveClassName?: string;
    showAll?: boolean;
    allowedGameTypes?: string[];
}

const ALL_GAMES = Object.values(GAME_CONFIG).map(g => ({
    gameType: g.gameType as GameFilter,
    label: g.label,
}));

/** Normalise pour une recherche insensible aux accents/casse. */
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function GameFilterPills({
    value,
    onChange,
    activeClassName = 'bg-red-600 text-white border-red-600',
    showAll = true,
    allowedGameTypes,
}: Props) {
    const games = useMemo(
        () => (allowedGameTypes ? ALL_GAMES.filter(g => allowedGameTypes.includes(g.gameType)) : ALL_GAMES),
        [allowedGameTypes],
    );

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fermer sur clic extérieur + Échap
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [open]);

    // Focus le champ de recherche à l'ouverture
    useEffect(() => { if (open) { setQuery(''); inputRef.current?.focus(); } }, [open]);

    const selected = value === 'ALL' ? null : games.find(g => g.gameType === value);
    const filtered = query ? games.filter(g => norm(g.label).includes(norm(query))) : games;

    const select = (v: GameFilter) => { onChange(v); setOpen(false); };

    return (
        <div ref={rootRef} className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`flex items-center gap-2 text-xs font-bold pl-3 pr-2 py-1.5 rounded-full border transition-colors min-w-[10rem] justify-between ${activeClassName}`}
            >
                <span className="flex items-center gap-1.5 truncate">
                    {selected
                        ? <><GameIcon gameType={selected.gameType} className="w-3.5 h-3.5 shrink-0" />{selected.label}</>
                        : <><RectangleGroupIcon className="w-3.5 h-3.5 shrink-0" />Tous les jeux</>}
                </span>
                <ChevronUpDownIcon className="w-4 h-4 shrink-0 opacity-70" />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Rechercher un jeu…"
                            className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                    </div>
                    <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
                        {showAll && games.length > 1 && !query && (
                            <Option
                                icon={<RectangleGroupIcon className="w-4 h-4" />}
                                label="Tous les jeux"
                                selected={value === 'ALL'}
                                onClick={() => select('ALL')}
                            />
                        )}
                        {filtered.map(g => (
                            <Option
                                key={g.gameType}
                                icon={<GameIcon gameType={g.gameType} className="w-4 h-4" />}
                                label={g.label}
                                selected={value === g.gameType}
                                onClick={() => select(g.gameType)}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <li className="px-3 py-3 text-sm text-gray-400 text-center">Aucun jeu trouvé</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Option({ icon, label, selected, onClick }: { icon: React.ReactNode; label: string; selected: boolean; onClick: () => void }) {
    return (
        <li>
            <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={onClick}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${selected ? 'bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
            >
                <span className="shrink-0 text-gray-500 dark:text-gray-400">{icon}</span>
                <span className="flex-1 truncate">{label}</span>
                {selected && <CheckIcon className="w-4 h-4 shrink-0 text-red-500" />}
            </button>
        </li>
    );
}
