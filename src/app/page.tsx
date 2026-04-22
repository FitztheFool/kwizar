'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
import GameIcon from '@/components/GameIcon';
import { PlayIcon, PlusIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 6;

interface Category { id: string; name: string; }
interface Quiz {
    id: string; title: string; description: string | null; isPublic: boolean;
    creatorId?: string; createdAt?: string;
    creator: { id: string; username: string };
    category?: { name: string } | null;
    _count: { questions: number };
    questions?: { points: number }[];
}

const computePoints = (list: Quiz[]) => {
    const map: Record<string, number> = {};
    list.forEach(q => { map[q.id] = q.questions?.reduce((sum, qq) => sum + (qq.points || 0), 0) || 0; });
    return map;
};

// ── Derived from GAME_CONFIG — single source of truth ────────────────────────

const GAMES_BY_MODE = {
    solo: Object.entries(GAME_CONFIG).filter(([, g]) => g.mode === 'solo'),
    both: Object.entries(GAME_CONFIG).filter(([, g]) => g.mode === 'both'),
    multi: Object.entries(GAME_CONFIG).filter(([, g]) => g.mode === 'multi'),
} satisfies Record<GameMode, [string, typeof GAME_CONFIG[keyof typeof GAME_CONFIG]][]>;

const ALL_GAMES = Object.entries(GAME_CONFIG).map(([key, g]) => ({
    key, label: g.label, href: `/leaderboard/${key}`,
}));

// ── Sub-components ────────────────────────────────────────────────────────────

function PersonIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

const MODE_STYLES = {
    solo: { pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', accent: 'border-l-blue-400', label: 'Solo' },
    both: { pill: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', accent: 'border-l-purple-400', label: 'Mixte' },
    multi: { pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', accent: 'border-l-emerald-400', label: 'Multi' },
};

function Pill({ mode }: { mode: GameMode }) {
    const s = MODE_STYLES[mode];
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${s.pill}`}>
            {s.label}
        </span>
    );
}

function SectionDivider({ label, badge, mode }: { label: string; badge: string; mode: GameMode }) {
    const colors = {
        solo: 'bg-blue-400',
        both: 'bg-purple-400',
        multi: 'bg-emerald-400',
    };
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-2 h-2 rounded-full ${colors[mode]}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                {badge}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>
    );
}

function GameCard({ gameKey, mode, wide = false }: { gameKey: string; mode: GameMode; wide?: boolean }) {
    const g = GAME_CONFIG[gameKey as keyof typeof GAME_CONFIG];
    const { accent } = MODE_STYLES[mode];
    return (
        <Link href={`/leaderboard/${gameKey}`}
            className={`
                group flex ${wide ? 'flex-row gap-3 items-start' : 'flex-col'}
                bg-white dark:bg-gray-900
                border border-gray-100 dark:border-gray-800 border-l-2 ${accent}
                rounded-xl p-4
                hover:border-gray-200 dark:hover:border-gray-700 hover:-translate-y-0.5
                transition-all duration-150
            `}>
            <span className={`text-gray-700 dark:text-gray-300 ${wide ? 'mt-0.5 shrink-0' : 'mb-2 block'} group-hover:scale-110 transition-transform`}>
                <GameIcon gameType={g.gameType} className="w-8 h-8" />
            </span>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">{g.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{g.description}</div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <PersonIcon /> {g.players}
                    </span>
                    <Pill mode={mode} />
                </div>
            </div>
        </Link>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [quizPoints, setQuizPoints] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState('');
    const [page, setPage] = useState(1);
    const [lobbyCode, setCode] = useState('');
    useEffect(() => { setCode(crypto.randomUUID()); }, []);

    const fetchQuizzes = useCallback(async (p = 1, s = '', cat = '') => {
        const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
        if (s) params.set('search', s);
        if (cat) params.set('categoryId', cat);
        const res = await fetch(`/api/quiz?${params}`);
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.quizzes ?? [];
            setQuizzes(list);
            setTotal(Array.isArray(data) ? list.length : data.total ?? 0);
            setTotalPages(Array.isArray(data) ? Math.ceil(list.length / PAGE_SIZE) : data.totalPages ?? 1);
            setQuizPoints(prev => ({ ...prev, ...computePoints(list) }));
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [catRes] = await Promise.all([fetch('/api/categories'), fetchQuizzes(1)]);
                if (!cancelled && catRes.ok) setCategories(await catRes.json());
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [fetchQuizzes]);

    const handlePageChange = (p: number) => { setPage(p); fetchQuizzes(p, search, categoryId); };
    const handleSearchChange = (v: string) => { setSearch(v); setPage(1); fetchQuizzes(1, v, categoryId); };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* ── Hero ───────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
                    style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Plateforme multijoueur
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-5">
                                Jouez. Rivalisez.<br />
                                <span className="text-blue-600 dark:text-blue-400">Grimpez.</span>
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                                Quiz, UNO, Taboo, Yahtzee et plus — testez-vous en solo ou entre amis en temps réel.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/lobby/all"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-px active:translate-y-0">
                                    <PlayIcon className="w-4 h-4 inline mr-1.5" />Rejoindre une partie
                                </Link>
                                <Link href={`/lobby/create/${lobbyCode}`}
                                    className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold text-sm rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-px active:translate-y-0">
                                    <PlusIcon className="w-4 h-4 inline mr-1.5" />Créer un lobby
                                </Link>
                            </div>
                        </div>
                        <div className="flex md:flex-col gap-4 flex-wrap">
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-center min-w-[120px]">
                                <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{total}</div>
                                <div className="text-xs text-gray-400 mt-1 font-medium">Quiz disponibles</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-center min-w-[120px]">
                                <div className="text-3xl font-black text-gray-900 dark:text-white">{ALL_GAMES.length}</div>
                                <div className="text-xs text-gray-400 mt-1 font-medium">Jeux</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ── Games by mode ──────────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-6 py-10">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-5">Nos jeux</h2>

                {/* Solo */}
                <div className="mt-8">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {GAMES_BY_MODE.multi.map(([key]) => (
                            <GameCard key={key} gameKey={key} mode="multi" wide />
                        ))}
                    </div>
                </div>

            </section>

        </div>
    );
}
