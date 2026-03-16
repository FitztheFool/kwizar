'use client';
import LoadingSpinner from '@/components/LoadingSpinner';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface QuizScore {
    createdAt: any;
    quizId: string;
    quizTitle: string;
    score: number;
    maxScore: number;
    completedAt: string;
}

interface LeaderboardEntry {
    rank: number;
    username: string;
    totalScore?: number;
    score?: number;
    quizzesCompleted?: number;
    quizScores?: QuizScore[];
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalEmoji = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        🏆 Classement Global
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Les meilleurs joueurs de Quiz App
                    </p>
                </div>

                {/* Leaderboard */}
                <div className="card">
                    {loading ? (
                        <div className="text-center py-12">
                            <LoadingSpinner message="Chargement du classement..." />
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 text-lg">Aucun score enregistré pour le moment.</p>
                            <p className="text-gray-500 mt-2">Soyez le premier à jouer !</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joueur</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Complétés</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaderboard.map((entry) => (
                                        <tr key={entry.rank} className={entry.rank <= 3 ? 'bg-yellow-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-2xl font-bold">{getMedalEmoji(entry.rank)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={session?.user?.username === entry.username ? '/dashboard' : `/profil/${entry.username}`}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                >
                                                    {entry.username}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {(entry.totalScore ?? entry.score ?? 0)} pts
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{entry.quizzesCompleted || '-'}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    {session ? (
                        <Link href="/dashboard" className="btn-primary inline-block">
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/login" className="btn-primary inline-block">
                            Jouer pour entrer dans le classement
                        </Link>
                    )}
                </div>
            </div>
        </div >
    );
}
