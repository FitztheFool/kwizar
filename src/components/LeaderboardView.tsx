// src/components/LeaderboardView.tsx
'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GAME_CONFIG, GameType as Game } from '@/lib/gameConfig';
import Pagination from '@/components/Pagination';
import GameFilterPills, { GameFilter } from '@/components/GameFilterPills';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingOverlay from '@/components/LoadingOverlay';
import GameIcon from '@/components/GameIcon';
import { sanitizeContentHtml } from '@/lib/sanitizeHtml';
import { gameThemeVarsByType } from '@/lib/theme/games';
import type { LeaderboardData } from '@/lib/leaderboard';
import { BookOpenIcon, ChartBarIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">1</span>;
    if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-bold">2</span>;
    if (rank === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-700 dark:bg-orange-800 text-orange-50 dark:text-orange-100 text-xs font-bold">3</span>;
    return <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">#{rank}</span>;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    score: number;
    gamesPlayed: number;
    wins?: number;
    detail: string;
    bestLevel?: number;
    elo?: number | null;
}

interface LeaderboardConfig {
    label: string;
    higherIsBetter: boolean;
    scoreLabel: string;
    description: string;
    rules?: string;
    score?: string;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}


interface Props {
    game: Game;
    /** Classement de la page courante, calculé côté serveur (SSR). */
    initialData?: LeaderboardData;
}

export default function LeaderboardView({ game, initialData }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Données 100% serveur : dérivées des props. Le parent remonte le composant
    // (key=`${game}-${page}`) à chaque changement de jeu/page → reseed automatique.
    const leaderboard: LeaderboardEntry[] = initialData?.leaderboard ?? [];
    const config = (initialData?.config as LeaderboardConfig | undefined) ?? null;
    const pagination: PaginationData | null = initialData?.pagination ?? null;
    const page = pagination?.page ?? 1;
    const initialLoading = !initialData;
    const refetching = isPending; // overlay pendant la navigation serveur

    const handleGameChange = (f: GameFilter) => {
        if (f === 'ALL') return;
        const key = Object.keys(GAME_CONFIG).find(k => GAME_CONFIG[k as keyof typeof GAME_CONFIG].gameType === f);
        if (key) router.push(`/leaderboard/${key}`);
    };

    // Pagination côté serveur : on navigue vers ?page=N, le serveur re-rend la page.
    const goToPage = (p: number) => startTransition(() => {
        router.push(`/leaderboard/${game}?page=${p}`, { scroll: false });
    });

    const gameType = GAME_CONFIG[game].gameType;
    const isSolo = GAME_CONFIG[game].mode === 'solo';
    const [lobbyCode] = useState(() => crypto.randomUUID());
    const myEntry = leaderboard.find(e => e.userId === session?.user?.id);
    const scoreLabel = config?.scoreLabel ?? GAME_CONFIG[game].scoreLabel;
    const label = config?.label ?? GAME_CONFIG[game].label;
    const showElo = leaderboard.some(e => e.elo != null);

    return (
        <div className="w-full mx-auto max-w-7xl min-h-screen p-4 md:p-8">

            <div className="glass rounded-2xl p-6 md:p-8 w-full">


                {/* Tabs → GameFilterPills */}
                <div className="mb-12">
                    <GameFilterPills
                        value={gameType}
                        onChange={handleGameChange}
                        showAll={false}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div style={gameThemeVarsByType(gameType)} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-game/10 border border-game/25 flex-shrink-0">
                        <GameIcon gameType={gameType} className="w-7 h-7 text-game" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classement {label}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {pagination
                                ? `${pagination.total} joueur${pagination.total > 1 ? 's' : ''} classé${pagination.total > 1 ? 's' : ''}${showElo ? ' · triés par ELO' : ''}`
                                : 'Chargement…'
                            }
                        </p>
                    </div>
                    {isSolo ? (
                        <Link href={`/game/${game}`}
                            className="px-4 py-2 bg-accent-gradient hover:brightness-110 text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-px shrink-0">
                            Jouer
                        </Link>
                    ) : (
                        <Link href={`/lobby/create/${lobbyCode}?game=${game}`}
                            className="px-4 py-2 bg-accent-gradient hover:brightness-110 text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-px shrink-0">
                            Créez un lobby
                        </Link>
                    )}
                </div>

                {/* Description / Rules / Score */}
                <div className="mb-6 space-y-2">
                    {(config?.description ?? GAME_CONFIG[game].description) && (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4">
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><RectangleGroupIcon className="w-3.5 h-3.5" /> Description</h2>
                            <div
                                className="text-sm text-gray-700 dark:text-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_p]:mb-1 [&_p:last-child]:mb-0"
                                dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(config?.description ?? GAME_CONFIG[game].description) }}
                            />
                        </div>
                    )}
                    {(config?.rules ?? GAME_CONFIG[game].rules) && (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><BookOpenIcon className="w-3.5 h-3.5" /> Règles</p>
                            <div
                                className="text-sm text-gray-700 dark:text-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_p]:mb-1 [&_p:last-child]:mb-0"
                                dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(config?.rules ?? GAME_CONFIG[game].rules ?? '') }}
                            />
                        </div>
                    )}
                    {(config?.score ?? GAME_CONFIG[game].score) && (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><ChartBarIcon className="w-3.5 h-3.5" /> Calcul des points</p>
                            <div
                                className="text-sm text-gray-700 dark:text-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_p]:mb-1 [&_p:last-child]:mb-0"
                                dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(config?.score ?? GAME_CONFIG[game].score ?? '') }}
                            />
                        </div>
                    )}
                </div>

                {/* Ma position */}
                {myEntry && (
                    <div className="mb-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <RankBadge rank={myEntry.rank} />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {myEntry.username} <span className="text-xs text-gray-400 font-normal">(moi)</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{myEntry.detail}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {myEntry.elo != null ? (
                                <>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{myEntry.elo}</p>
                                    <p className="text-xs text-gray-400">ELO · {myEntry.score} {scoreLabel.toLowerCase()}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-blue-700">{myEntry.score}</p>
                                    <p className="text-xs text-gray-400">
                                        {scoreLabel}{myEntry.bestLevel ? ` · niv. ${myEntry.bestLevel}` : ''}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Tableau */}
                {initialLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <LoadingSpinner fullScreen={false} message="Chargement du classement…" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                        <RectangleGroupIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 font-semibold">Aucune partie enregistrée</p>
                        <p className="text-gray-400 text-sm mt-1">Soyez le premier à jouer !</p>
                    </div>
                ) : (
                    <LoadingOverlay loading={refetching}>

                        <div className="w-full overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                            <table className="w-full divide-y divide-gray-100">
                                <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rang</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joueur</th>
                                        {showElo && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ELO</th>}
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{scoreLabel}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Détail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {leaderboard.map(entry => {
                                        const isMe = entry.userId === session?.user?.id;
                                        const isPodium = entry.rank <= 3;
                                        return (
                                            <tr key={entry.userId}
                                                className={`transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : isPodium ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <RankBadge rank={entry.rank} />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <Link href={isMe ? '/dashboard' : `/user/${entry.username}`}
                                                        className="text-sm font-medium hover:underline text-blue-600 dark:text-blue-400 truncate block max-w-[200px]">
                                                        {entry.username}
                                                    </Link>
                                                    {isMe && <span className="text-xs opacity-60">(moi)</span>}
                                                </td>
                                                {showElo && (
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {entry.elo != null
                                                            ? <span className="text-sm font-bold text-gray-900 dark:text-white">{entry.elo}</span>
                                                            : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={showElo ? 'text-sm font-medium text-gray-600 dark:text-gray-300' : 'text-sm font-bold text-gray-900 dark:text-white'}>
                                                        {entry.score}
                                                    </span>
                                                    {!!entry.bestLevel && (
                                                        <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500">niv.{entry.bestLevel}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className="text-xs text-gray-700 dark:text-gray-300">{entry.detail}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <>
                                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                                    Page {page}/{pagination.totalPages} · {pagination.total} joueur{pagination.total > 1 ? 's' : ''}
                                </p>
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={goToPage}
                                />
                            </>
                        )}
                    </LoadingOverlay>
                )}
            </div>
        </div>
    );
}
