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
        solo: 'bg-primary-500',
        both: 'bg-clay-500',
        multi: 'bg-felt-600',
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
        <div className="min-h-screen">

            {/* ── Hero ───────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden brand-hero border-b border-felt-900/40">
                <div className="relative max-w-5xl mx-auto px-6 py-10 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                        {/* Left: title + CTAs */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80 mb-3">
                                La table de jeu qui ne dort jamais
                            </p>
                            <h1 className="font-display text-4xl md:text-5xl font-semibold text-amber-50 leading-[1.05] tracking-tight mb-5">
                                Jouez. Rivalisez.{' '}
                                <span className="italic text-primary-300">Grimpez.</span>
                            </h1>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/lobby/all"
                                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-black/30 hover:-translate-y-px active:translate-y-0">
                                    <PlayIcon className="w-4 h-4 inline mr-1.5" />Rejoindre une partie
                                </Link>
                                <Link href={`/lobby/create/${lobbyCode}`}
                                    className="px-5 py-2.5 bg-amber-50/10 hover:bg-amber-50/20 text-amber-50 font-bold text-sm rounded-xl border border-amber-100/30 backdrop-blur-sm transition-all hover:-translate-y-px active:translate-y-0">
                                    <PlusIcon className="w-4 h-4 inline mr-1.5" />Créer un lobby
                                </Link>
                            </div>
                        </div>
                        {/* Right: live stats — wooden score tokens */}
                        <div className="grid grid-cols-3 gap-2.5 md:shrink-0">
                            {([
                                { value: fmt(nbJeux), label: 'jeux' },
                                { value: stats ? fmt(stats.parties) : null, label: 'parties' },
                                { value: stats ? fmt(stats.points) : null, label: 'points' },
                            ] as const).map(({ value, label }) => (
                                <div key={label} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-100/15 bg-stone-950/25 backdrop-blur-sm px-4 py-3 min-w-[90px] text-center shadow-inner">
                                    <span className="font-display text-2xl font-bold text-amber-50">
                                        {value ?? <span className="text-amber-100/30">—</span>}
                                    </span>
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-amber-200/60">{label}</span>
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
