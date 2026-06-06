'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import Link from 'next/link';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
import GameCard from '@/components/GameCard';
import { PlayIcon, PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type Stats = { parties: number; points: number };

// ── Derived from GAME_CONFIG — single source of truth ────────────────────────

const GAMES_BY_MODE = {
    solo: Object.entries(GAME_CONFIG).filter(([, g]) => (g.mode as GameMode) === 'solo'),
    both: Object.entries(GAME_CONFIG).filter(([, g]) => (g.mode as GameMode) === 'both'),
    multi: Object.entries(GAME_CONFIG).filter(([, g]) => (g.mode as GameMode) === 'multi'),
} satisfies Record<GameMode, [string, typeof GAME_CONFIG[keyof typeof GAME_CONFIG]][]>;

// ── Sub-components ────────────────────────────────────────────────────────────

const MODE_DOT: Record<GameMode, string> = {
    solo: 'bg-primary-500',
    both: 'bg-clay-500',
    multi: 'bg-felt-600',
};

function GameSection({
    label,
    badge,
    mode,
    games,
}: {
    label: string;
    badge: string;
    mode: GameMode;
    games: [string, unknown][];
}) {
    const [open, setOpen] = useState(true);
    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 mb-4 group text-left"
            >
                <div className={`w-2 h-2 rounded-full ${MODE_DOT[mode]}`} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    {label}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                    {badge}
                </span>
                <ChevronDownIcon className={`w-4 h-4 shrink-0 text-gray-500 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-transform ${open ? '' : '-rotate-90'}`} />
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            </button>
            {open && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {games.map(([key]) => (
                        <GameCard key={key} gameKey={key} mode={mode} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'k';
    return n.toString();
}

export default function HomePage() {
    const [lobbyCode, setCode] = useState('');
    const { data: stats } = useSWR<Stats>('/api/stats', fetcher);
    const nbJeux = Object.keys(GAME_CONFIG).length;

    useEffect(() => { setCode(crypto.randomUUID()); }, []);

    return (
        <div className="min-h-screen">

            {/* ── Hero (modern dark / glassy) ──────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-white/5">
                {/* Dark base + accent glows */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-felt-900 via-stone-950 to-stone-950" />
                <div className="absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-felt-500/20 blur-3xl" />
                <div className="absolute -top-10 right-0 -z-10 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
                <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-20">
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        {/* Left: title + CTAs */}
                        <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300/80">
                                La table de jeu qui ne dort jamais
                            </p>
                            <h1 className="mb-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-white md:text-6xl">
                                Jouez. Rivalisez.{' '}
                                <span className="bg-accent-gradient bg-clip-text text-transparent">Grimpez.</span>
                            </h1>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/lobby/all"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]">
                                    <PlayIcon className="h-4 w-4" />Rejoindre une partie
                                </Link>
                                <Link href={`/lobby/create/${lobbyCode}`}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/[0.1] active:scale-[0.98]">
                                    <PlusIcon className="h-4 w-4" />Créer un lobby
                                </Link>
                            </div>
                        </div>
                        {/* Right: live stats — glass tokens */}
                        <div className="grid grid-cols-3 gap-2.5 md:shrink-0">
                            {([
                                { value: fmt(nbJeux), label: 'jeux' },
                                { value: stats ? fmt(stats.parties) : null, label: 'parties' },
                                { value: stats ? fmt(stats.points) : null, label: 'points' },
                            ] as const).map(({ value, label }) => (
                                <div key={label} className="flex min-w-[90px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center shadow-glass backdrop-blur-xl">
                                    <span className="font-display text-2xl font-bold text-white">
                                        {value ?? <span className="text-white/30">—</span>}
                                    </span>
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Games by mode ──────────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-6 py-10">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-8">Nos jeux</h2>

                {/* Solo */}
                <div className="mt-4">
                    <GameSection label="Solo uniquement" badge="1 joueur" mode="solo" games={GAMES_BY_MODE.solo} />
                </div>

                {/* Solo + Multi */}
                <div className="mt-12">
                    <GameSection label="Solo ou multijoueur" badge="1 – 8 joueurs" mode="both" games={GAMES_BY_MODE.both} />
                </div>

                {/* Multi only */}
                <div className="mt-12">
                    <GameSection label="Multijoueur uniquement" badge="3+ joueurs" mode="multi" games={GAMES_BY_MODE.multi} />
                </div>

            </section>

        </div>
    );
}
