'use client';
import LoadingSpinner from '@/components/LoadingSpinner';

import Link from 'next/link';
import { notFound as nextNotFound } from 'next/navigation';
import { useMemo } from 'react';
import QuizResults from '@/components/Quiz/QuizResults';
import { useRouter } from 'next/navigation';
import { useQuizResult, type LeaderboardEntry } from '@/hooks/useQuizResult';
import { getQuizSocket } from '@/lib/socket';
import RankBadge from '@/components/shared/RankBadge';
import MeTag from '@/components/shared/MeTag';
import EloDeltaBadge from '@/components/shared/EloDeltaBadge';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import LobbyWaitingRoom from '@/components/Quiz/LobbyWaitingRoom';
import { TrophyIcon } from '@heroicons/react/24/outline';

// Consistent medal palette (gold / silver / bronze) — independent of light/dark mode
// so the row keeps the same color whether the row belongs to "me" or not.
const rankStyle = (i: number) => ({
    border:
        i === 0
            ? 'border-amber-400'
            : i === 1
                ? 'border-slate-400'
                : 'border-orange-400',
    bg:
        i === 0
            ? 'bg-amber-200/40'
            : i === 1
                ? 'bg-slate-200/40'
                : 'bg-orange-200/40',
    text:
        i === 0
            ? 'text-amber-950'
            : i === 1
                ? 'text-slate-900'
                : 'text-orange-950',
    score:
        i === 0
            ? 'text-amber-900'
            : i === 1
                ? 'text-slate-800'
                : 'text-orange-900',
});

export default function QuizResultPage() {
    const router = useRouter();
    const {
        quizId,
        lobbyCode,
        session,
        authStatus,
        payload,
        notFound,
        leaderboard,
        playerProgress,
        totalPlayers,
        allFinished,
        handleRestart,
    } = useQuizResult();

    const socket = useMemo(() => (lobbyCode ? getQuizSocket() : null), [lobbyCode]);
    const myElo = useEloUpdate('quiz', session?.user?.id);
    const mode = !lobbyCode ? 'solo' : !allFinished ? 'waiting' : 'podium';

    const handleRejouer = () => {
        if (lobbyCode) socket?.emit('lobby:restart');
        router.push(`/lobby/create/${lobbyCode}`);
    };

    if (authStatus === 'loading') {
        return <LoadingSpinner message="Chargement des résultats..." />;
    }

    if (notFound) {
        nextNotFound();
    }

    if (!payload) {
        return <LoadingSpinner message="Chargement des résultats..." />;
    }

    if (mode === 'waiting') {
        return (
            <LobbyWaitingRoom
                score={payload.score}
                totalPoints={payload.totalPoints}
                leaderboard={leaderboard}
                playerProgress={playerProgress}
                totalPlayers={totalPlayers}
                currentUserId={session?.user?.id}
            />
        );
    }

    // solo + podium use the same layout
    const isSolo = mode === 'solo';
    const displayLeaderboard: LeaderboardEntry[] = isSolo
        ? [{
            userId: session?.user?.id ?? 'me',
            username: session?.user?.username ?? session?.user?.email ?? 'Vous',
            totalScore: payload.score,
            questionResults: payload.questionResults,
        }]
        : leaderboard;

    return (
        <div className="min-h-screen wood-table">
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8 rounded-xl wood-tile p-8 shadow-2xl">
                    <div className="mb-6 text-center">
                        <div className="mb-3 flex justify-center"><TrophyIcon className="w-16 h-16 text-amber-500" /></div>
                        <h1 className="mb-1 text-3xl font-bold text-stone-900">
                            Classement final
                        </h1>
                        <p className="mb-4 text-stone-700">{payload.quizTitle}</p>
                        <div className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-800/30 bg-stone-900/10 px-5 py-3">
                            <span className="font-semibold text-stone-700">
                                Ton score
                            </span>
                            <span className="text-xl font-extrabold text-amber-900">
                                {payload.score}
                                <span className="text-sm font-medium text-stone-600">
                                    {' '}/ {payload.totalPoints} pts
                                </span>
                            </span>
                        </div>
                        {myElo && (
                            <div className="mt-3 flex justify-center">
                                <EloDeltaBadge elo={myElo} />
                            </div>
                        )}
                    </div>

                    {displayLeaderboard.length > 0 && (
                        <>
                            <div className="mb-4 space-y-3">
                                {displayLeaderboard.slice(0, 3).map((entry, i) => {
                                    const s = rankStyle(i);
                                    return (
                                        <div
                                            key={entry.userId}
                                            className={`flex items-center gap-4 rounded-xl border-2 p-4 ${s.border} ${s.bg}`}
                                        >
                                            <RankBadge rank={i + 1} />
                                            <span className={`flex-1 text-lg font-bold ${s.text}`}>
                                                {entry.username}
                                                {entry.userId === session?.user?.id && <MeTag />}
                                            </span>
                                            <span className={`text-xl font-bold ${s.score}`}>
                                                {entry.totalScore} pts
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {displayLeaderboard.length > 3 && (
                                <div className="space-y-2">
                                    {displayLeaderboard.slice(3).map((entry, i) => (
                                        <div
                                            key={entry.userId}
                                            className="flex items-center gap-4 rounded-xl border border-amber-800/20 bg-stone-900/5 px-4 py-3"
                                        >
                                            <span className="w-10 text-center font-bold text-stone-600">
                                                {i + 4}
                                            </span>
                                            <span className="flex-1 font-medium text-stone-800">
                                                {entry.username}
                                                {entry.userId === session?.user?.id && <MeTag />}
                                            </span>
                                            <span className="font-bold text-stone-700">
                                                {entry.totalScore} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
<Link
                            href="/dashboard"
                            className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/"
                            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Accueil
                        </Link>
                    </div>
                </div>

                <QuizResults
                    quizTitle={payload.quizTitle}
                    quizId={quizId}
                    score={payload.score}
                    totalPoints={payload.totalPoints}
                    questionResults={payload.questionResults}
                    isOwnQuiz={payload.isOwnQuiz}
                    isAuthenticated={authStatus === 'authenticated'}
                    leaderboard={leaderboard.length > 0 ? leaderboard : undefined}
                    currentUserId={session?.user?.id}
                    currentUsername={session?.user?.username ?? session?.user?.email ?? 'Vous'}
                    hideHeader
                />
            </div>
        </div>
    );
}

