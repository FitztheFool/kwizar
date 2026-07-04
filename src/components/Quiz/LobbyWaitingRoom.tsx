'use client';

import { useMemo } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import MeTag from '@/components/shared/MeTag';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { LeaderboardEntry, PlayerProgress } from '@/hooks/useQuizResult';

interface Props {
    score: number;
    totalPoints: number;
    leaderboard: LeaderboardEntry[];
    playerProgress: PlayerProgress[];
    totalPlayers: number;
    currentUserId?: string;
}

export default function LobbyWaitingRoom({
    score,
    totalPoints,
    leaderboard,
    playerProgress,
    totalPlayers,
    currentUserId,
}: Props) {
    const finishedCount = leaderboard.length;
    const finishedPct = totalPlayers > 0 ? (finishedCount / totalPlayers) * 100 : 0;

    const inProgressPlayers = useMemo(
        () => playerProgress.filter(p => !leaderboard.find(l => l.userId === p.userId)),
        [playerProgress, leaderboard]
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-lg">
                <div className="mb-4 flex items-center justify-between rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">Quiz terminé !</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            En attente des autres joueurs…
                        </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {score}
                        <span className="text-base font-normal text-gray-400 dark:text-gray-500">
                            {' '}
                            / {totalPoints} pts
                        </span>
                    </span>
                </div>

                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100">Joueurs</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {finishedCount} / {totalPlayers || '?'} terminé{finishedCount > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="mb-5 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-700"
                            style={{ width: `${finishedPct}%` }}
                        />
                    </div>

                    <div className="space-y-3">
                        {leaderboard.map((entry) => (
                            <div key={entry.userId} className="flex items-center gap-3">
                                <CheckIcon className="w-5 h-5 shrink-0 text-green-500 dark:text-green-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {entry.username}
                                    {entry.userId === currentUserId && <MeTag />}
                                </span>
                            </div>
                        ))}
                        {inProgressPlayers.map((player) => {
                            const pct = player.totalQuestions > 0
                                ? (player.currentQuestion / player.totalQuestions) * 100
                                : 0;
                            return (
                                <div key={player.userId} className="flex items-center gap-3">
                                    <div className="shrink-0">
                                        <LoadingSpinner fullScreen={false} size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {player.username}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {player.currentQuestion}/{player.totalQuestions}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className="h-1.5 rounded-full bg-blue-400 transition-all duration-500 dark:bg-blue-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
