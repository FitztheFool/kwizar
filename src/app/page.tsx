'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import Link from 'next/link';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
import GameCard from '@/components/GameCard';
import GameIcon from '@/components/GameIcon';
import TrendingCarousel from '@/components/TrendingCarousel';
import { PlayIcon, PlusIcon, ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Stats = { parties: number; points: number };

/** Normalise pour une recherche insensible aux accents/casse (comme admin#games). */
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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

// ── Filtre par mode (onglets) ─────────────────────────────────────────────────
type Filter = GameMode | 'all';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'solo', label: 'Solo' },
    { key: 'both', label: 'Mixte' },
    { key: 'multi', label: 'Multi' },
];

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
    const { data: enabledData } = useSWR<{ enabled: string[] }>('/api/games/enabled', fetcher);

    // Tant que la liste n'est pas chargée, on n'exclut rien (évite un flash vide).
    const enabledSet = enabledData ? new Set(enabledData.enabled) : null;
    const isEnabled = (key: string) => !enabledSet || enabledSet.has(key);
    const visibleByMode = {
        solo: GAMES_BY_MODE.solo.filter(([key]) => isEnabled(key)),
        both: GAMES_BY_MODE.both.filter(([key]) => isEnabled(key)),
        multi: GAMES_BY_MODE.multi.filter(([key]) => isEnabled(key)),
    };
    const nbJeux = visibleByMode.solo.length + visibleByMode.both.length + visibleByMode.multi.length;

    // ── Filtre par mode (onglets) — état synchronisé avec l'URL (?mode=…) ──────
    const [filter, setFilter] = useState<Filter>('all');
    const counts: Record<Filter, number> = {
        all: nbJeux,
        solo: visibleByMode.solo.length,
        both: visibleByMode.both.length,
        multi: visibleByMode.multi.length,
    };

    // Initialise depuis l'URL (liens partageables : /?mode=solo).
    useEffect(() => {
        const m = new URLSearchParams(window.location.search).get('mode');
        if (m === 'solo' || m === 'both' || m === 'multi') setFilter(m);
    }, []);

    const changeFilter = (f: Filter) => {
        setFilter(f);
        window.history.replaceState(null, '', f === 'all' ? '/' : `/?mode=${f}`);
    };

    // ── Recherche de jeu (combobox autocomplétée, comme admin#games) ───────────
    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!searchOpen) return;
        const onClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [searchOpen]);

    // Filtrage combiné : onglet (mode) ET recherche par nom. Ce qu'on peut voir = ce qu'on peut chercher.
    const q = norm(search.trim());
    const inTab = (mode: GameMode) => filter === 'all' || filter === mode;
    const matchesQ = ([key, g]: [string, { label: string }]) => !q || norm(g.label).includes(q) || norm(key).includes(q);
    const shownByMode: Record<GameMode, [string, { label: string }][]> = {
        solo: inTab('solo') ? visibleByMode.solo.filter(matchesQ) : [],
        both: inTab('both') ? visibleByMode.both.filter(matchesQ) : [],
        multi: inTab('multi') ? visibleByMode.multi.filter(matchesQ) : [],
    };
    const totalShown = shownByMode.solo.length + shownByMode.both.length + shownByMode.multi.length;

    // Suggestions du dropdown : jeux du périmètre de l'onglet courant, filtrés par la saisie, triés.
    const suggestions = [
        ...(inTab('solo') ? visibleByMode.solo : []),
        ...(inTab('both') ? visibleByMode.both : []),
        ...(inTab('multi') ? visibleByMode.multi : []),
    ].filter(matchesQ).sort((a, b) => a[1].label.localeCompare(b[1].label, 'fr'));

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
                <TrendingCarousel />

                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-5">Nos jeux</h2>

                {/* Recherche (combobox autocomplétée) + onglets de filtre par mode */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div ref={searchRef} className="relative w-full sm:max-w-xs">
                        <MagnifyingGlassIcon className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Rechercher un jeu…"
                            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.06] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 backdrop-blur-xl"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setSearchOpen(false); }}
                                className="absolute inset-y-0 right-2 my-auto flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                title="Effacer"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                        {searchOpen && suggestions.length > 0 && (
                            <ul role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-stone-900 shadow-xl py-1">
                                {suggestions.map(([key, g]) => (
                                    <li key={key}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={norm(search) === norm(g.label)}
                                            onClick={() => { setSearch(g.label); setSearchOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                                        >
                                            <GameIcon gameType={g.gameType} className="w-5 h-5 shrink-0 rounded" />
                                            <span className="flex-1 truncate">{g.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Onglets de filtre par mode — n'affiche qu'un mode à la fois */}
                    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-black/5 dark:border-white/10 bg-gray-100 dark:bg-white/[0.06] p-1 backdrop-blur-xl">
                        {FILTERS.map(({ key, label }) => {
                            const active = filter === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => changeFilter(key)}
                                    aria-pressed={active}
                                    className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${active
                                        ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    {label}
                                    <span className={`text-[10px] font-semibold ${active ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400/70 dark:text-gray-500/70'}`}>
                                        {counts[key]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {search.trim() && totalShown === 0 && (
                    <p className="px-4 py-10 text-sm text-center text-gray-400 dark:text-gray-500">
                        Aucun jeu ne correspond à « {search} ».
                    </p>
                )}

                <div className="space-y-12">
                    {/* Solo */}
                    {shownByMode.solo.length > 0 && (
                        <GameSection label="Solo uniquement" badge="1 joueur" mode="solo" games={shownByMode.solo} />
                    )}

                    {/* Solo + Multi */}
                    {shownByMode.both.length > 0 && (
                        <GameSection label="Solo ou multijoueur" badge="1 – 8 joueurs" mode="both" games={shownByMode.both} />
                    )}

                    {/* Multi only */}
                    {shownByMode.multi.length > 0 && (
                        <GameSection label="Multijoueur uniquement" badge="3+ joueurs" mode="multi" games={shownByMode.multi} />
                    )}
                </div>

            </section>

        </div>
    );
}
