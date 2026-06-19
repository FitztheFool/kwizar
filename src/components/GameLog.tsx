'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type LogTone = 'move' | 'attack' | 'defend' | 'safety' | 'coup' | 'system' | 'score' | 'turn';

export interface GameLogEntry {
    id: number | string;
    tone: LogTone;
    text: string;
}

const TONE_STYLE: Record<LogTone, string> = {
    move: 'text-sky-700 dark:text-sky-200',
    attack: 'text-red-600 dark:text-red-300 font-semibold',
    defend: 'text-emerald-700 dark:text-emerald-200',
    safety: 'text-amber-700 dark:text-amber-200 font-semibold',
    coup: 'text-purple-700 dark:text-purple-200 font-bold',
    score: 'text-amber-700 dark:text-amber-200 font-semibold',
    turn: 'text-gray-600 dark:text-gray-300',
    system: 'text-gray-500 dark:text-gray-400 italic',
};

const TONE_ICON: Partial<Record<LogTone, string>> = {
    coup: '⚡ ',
};

const STORAGE_KEY = 'kwizar:gameLogOpen';

/** Read/write the shared open/closed preference so the toggle is consistent across games. */
function useLogOpen(): [boolean, (v: boolean) => void] {
    const [open, setOpen] = useState(true);
    useEffect(() => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored !== null) setOpen(stored === '1');
    }, []);
    const set = (v: boolean) => {
        setOpen(v);
        try { window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch { /* ignore */ }
    };
    return [open, set];
}

interface Props {
    entries: GameLogEntry[];
    title?: string;
    className?: string;
}

/** Shared in-game action journal with a built-in show/hide toggle. */
export default function GameLog({ entries, title = 'Journal', className = '' }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useLogOpen();
    useEffect(() => {
        // Scroll the log container only, never the page (scrollIntoView would move the window).
        const el = scrollRef.current;
        if (open && el) el.scrollTop = el.scrollHeight;
    }, [entries, open]);

    return (
        <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl px-4 py-3 w-full ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>
            {open && (
                <div ref={scrollRef} className="mt-1.5 max-h-28 lg:max-h-[70vh] overflow-y-auto space-y-0.5 text-xs leading-snug pr-1">
                    {entries.length === 0 && <p className="text-gray-400 dark:text-gray-500 italic">La partie commence…</p>}
                    {entries.map(e => (
                        <p key={e.id} className={TONE_STYLE[e.tone] ?? 'text-gray-600 dark:text-gray-300'}>
                            {TONE_ICON[e.tone] ?? ''}{e.text}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Wraps GameLog in the standard right-sidebar shell used by all game pages. */
export function GameLogSidebar({ entries, title }: { entries: GameLogEntry[]; title?: string }) {
    return (
        <aside className="w-full lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-4">
                <GameLog entries={entries} title={title} />
            </div>
        </aside>
    );
}
