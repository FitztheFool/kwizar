// src/components/PlayerModal.tsx
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UsersIcon, XMarkIcon, NoSymbolIcon, ClockIcon, CpuChipIcon } from '@heroicons/react/24/outline';

function RankBadge({ placement }: { placement: number }) {
    if (placement === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">1</span>;
    if (placement === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-bold">2</span>;
    if (placement === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">3</span>;
    return <span className="text-xs text-gray-400 font-semibold">#{placement}</span>;
}

interface Player {
    username: string;
    score: number;
    placement: number | null;
    abandon?: boolean;
    afk?: boolean;
    isBot?: boolean;
}

interface PlayerModalProps {
    gameId: string;
    players: Player[];
    onClose: () => void;
}

export default function PlayerModal({ gameId, players, onClose }: PlayerModalProps) {
    const { data: session } = useSession();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-80 max-w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        Joueurs de la partie
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-2">
                    {players.map((p, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center">
                                    {p.abandon
                                        ? <NoSymbolIcon className="w-4 h-4 text-gray-400" />
                                        : p.afk
                                            ? <ClockIcon className="w-4 h-4 text-gray-400" />
                                            : p.isBot
                                                ? <CpuChipIcon className="w-4 h-4 text-gray-400" />
                                                : p.placement != null
                                                    ? <RankBadge placement={p.placement} />
                                                    : null
                                    }
                                </span>
                                {p.isBot ? (
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{p.username}</span>
                                ) : (
                                    <Link
                                        href={session?.user?.username === p.username ? '/dashboard' : `/user/${p.username}`}
                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        onClick={onClose}
                                    >
                                        {p.username}
                                    </Link>
                                )}
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {p.score} <span className="text-xs text-gray-400 font-normal">pts</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
