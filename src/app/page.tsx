'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
import GameCard from '@/components/GameCard';
import { PlayIcon, PlusIcon } from '@heroicons/react/24/outline';

type Stats = { parties: number; points: number };

// ── Derived from GAME_CONFIG — single source of truth ────────────────────────

const GAMES_BY_MODE = {
    solo: Object.entries(GAME_CONFIG).filter(([, g]) => (g.mode as GameMode) === 'solo'),
    both: Object.entries(GAME_CONFIG).filter(([, g]) => (g.mode as GameMode) === 'both'),
    multi: Object.entries(GAME_CONFIG).filter(([, g]) => (g.mode as GameMode) === 'multi'),
} satisfies Record<GameMode, [string, typeof GAME_CONFIG[keyof typeof GAME_CONFIG]][]>;

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionDivider({ label, badge, mode }: { label: string; badge: string; mode: GameMode }) {
    const colors = {
        solo: 'bg-blue-400',
        both: 'bg-purple-400',
        multi: 'bg-emerald-400',
    };
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-2 h-2 rounded-full ${colors[mode]}`} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                {badge}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
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
    const [stats, setStats] = useState<Stats | null>(null);
    const nbJeux = Object.keys(GAME_CONFIG).length;

    useEffect(() => { setCode(crypto.randomUUID()); }, []);
    useEffect(() => {
        fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* ── Hero ───────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
                    style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative max-w-5xl mx-auto px-6 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        {/* Left: title + CTAs */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-3">
                                Jouez. Rivalisez.{' '}
                                <span className="text-blue-600 dark:text-blue-400">Grimpez.</span>
                            </h1>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/lobby/all"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-px active:translate-y-0">
                                    <PlayIcon className="w-4 h-4 inline mr-1.5" />Rejoindre une partie
                                </Link>
                                <Link href={`/lobby/create/${lobbyCode}`}
                                    className="px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold text-sm rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-px active:translate-y-0">
                                    <PlusIcon className="w-4 h-4 inline mr-1.5" />Créer un lobby
                                </Link>
                            </div>
                        </div>
                        {/* Right: live stats */}
                        <div className="grid grid-cols-3 gap-2.5 md:shrink-0">
                            {([
                                { value: fmt(nbJeux), label: 'jeux' },
                                { value: stats ? fmt(stats.parties) : null, label: 'parties' },
                                { value: stats ? fmt(stats.points) : null, label: 'points' },
                            ] as const).map(({ value, label }) => (
                                <div key={label} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 min-w-[90px] text-center">
                                    <span className="text-xl font-black text-gray-900 dark:text-white">
                                        {value ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{label}</span>
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
                    <SectionDivider label="Solo uniquement" badge="1 joueur" mode="solo" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {GAMES_BY_MODE.solo.map(([key]) => (
                            <GameCard key={key} gameKey={key} mode="solo" />
                        ))}
                    </div>
                </div>

                {/* Solo + Multi */}
                <div className="mt-12">
                    <SectionDivider label="Solo ou multijoueur" badge="1 – 8 joueurs" mode="both" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {GAMES_BY_MODE.both.map(([key]) => (
                            <GameCard key={key} gameKey={key} mode="both" />
                        ))}
                    </div>
                </div>

                {/* Multi only */}
                <div className="mt-12">
                    <SectionDivider label="Multijoueur uniquement" badge="3+ joueurs" mode="multi" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {GAMES_BY_MODE.multi.map(([key]) => (
                            <GameCard key={key} gameKey={key} mode="multi" />
                        ))}
                    </div>
                </div>

            </section>

        </div>
    );
}
