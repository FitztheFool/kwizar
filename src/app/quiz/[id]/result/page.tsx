'use client';

import Link from 'next/link';
import QuizResults from '@/components/QuizResults';
import { useQuizResult, LeaderboardEntry } from '@/hooks/useQuizResult';

const PODIUM_EMOJIS = ['🥇', '🥈', '🥉'];

export default function QuizResultPage() {
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

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (authStatus === 'loading') {
        return <LoadingScreen text="Chargement des résultats..." />;
    }

    if (notFound || !payload) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md mx-4">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Résultats introuvables</h2>
                    <p className="text-gray-600 mb-6">
                        Les résultats ont expiré ou n&apos;existent pas. Faites le quiz pour voir vos résultats.
                    </p>
                    <Link href={`/quiz/${quizId}`} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                        Faire le quiz
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Mode LOBBY : salle d'attente ─────────────────────────────────────────
    if (lobbyCode && !allFinished) {
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

    // ─── Mode LOBBY : podium final ────────────────────────────────────────────
    if (lobbyCode && allFinished) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

                    <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-3">🏆</div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-1">Classement final</h1>
                            <p className="text-gray-500">{payload.quizTitle}</p>
                        </div>

                        {/* Top 3 */}
                        <div className="space-y-3 mb-4">
                            {leaderboard.slice(0, 3).map((entry, i) => (
                                <div key={entry.userId} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                                    i === 0 ? 'border-yellow-400 bg-yellow-50' :
                                    i === 1 ? 'border-gray-300 bg-gray-50' :
                                    'border-amber-500/40 bg-amber-50/50'
                                }`}>
                                    <span className="text-4xl w-10 text-center">{PODIUM_EMOJIS[i]}</span>
                                    <span className={`flex-1 font-bold text-lg ${
                                        i === 0 ? 'text-yellow-800' :
                                        i === 1 ? 'text-gray-700' :
                                        'text-amber-800'
                                    }`}>
                                        {entry.username}
                                        {entry.userId === session?.user?.id && <span className="text-sm font-normal text-gray-400 ml-2">(moi)</span>}
                                    </span>
                                    <span className={`font-bold text-xl ${
                                        i === 0 ? 'text-yellow-700' :
                                        i === 1 ? 'text-gray-600' :
                                        'text-amber-700'
                                    }`}>{entry.totalScore} pts</span>
                                </div>
                            ))}
                        </div>

                        {/* Reste du classement */}
                        {leaderboard.length > 3 && (
                            <div className="space-y-2">
                                {leaderboard.slice(3).map((entry, i) => (
                                    <div key={entry.userId} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                                        <span className="text-gray-500 font-bold w-10 text-center">{i + 4}</span>
                                        <span className="flex-1 text-gray-700 font-medium">
                                            {entry.username}
                                            {entry.userId === session?.user?.id && <span className="text-sm font-normal text-gray-400 ml-2">(moi)</span>}
                                        </span>
                                        <span className="text-gray-600 font-bold">{entry.totalScore} pts</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center mt-8 flex-wrap">
                            <button onClick={handleRestart} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                Rejouer
                            </button>
                            <Link href="/dashboard" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                                Dashboard
                            </Link>
                            <Link href="/" className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium">
                                Accueil
                            </Link>
                        </div>
                    </div>

                    {/* Récapitulatif */}
                    <div className="bg-white rounded-xl shadow-2xl p-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Récapitulatif</h3>
                        <div className="space-y-4">
                            {payload.questionResults.map((result, index) => (
                                <div key={result.questionId} className={`p-5 rounded-xl border-2 ${result.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <p className="font-semibold text-gray-900">
                                            <span className="text-gray-500 font-normal mr-2">Q{index + 1}.</span>
                                            {result.questionText}
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-xl ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                {result.isCorrect ? '✓' : '✗'}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${result.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                {result.earnedPoints > 0 ? `+${result.earnedPoints} pts` : '0 pt'}
                                            </span>
                                        </div>
                                    </div>

                                    {result.type === 'MULTI_TEXT' ? (
                                        <div className="mt-2">
                                            <p className={`text-sm mb-2 ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                                <span className="font-medium">Votre réponse : </span>
                                                {result.userAnswerText || <span className="italic opacity-70">Aucune réponse</span>}
                                            </p>
                                            <div className="border-2 border-blue-300 bg-blue-50 rounded-lg px-3 py-2">
                                                <p className="text-sm font-medium text-blue-800 mb-2">Réponses attendues :</p>
                                                <div className="space-y-1">
                                                    {result.correctAnswerText.split(', ').map((c, i) => {
                                                        const isGood = result.userAnswerText.split(', ').some(u => u.trim().toLowerCase() === c.trim().toLowerCase());
                                                        return (
                                                            <div key={i} className={`text-sm px-3 py-1.5 rounded-lg border font-medium ${isGood ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-blue-200 text-blue-700'}`}>
                                                                {isGood ? '✓' : '•'} {c}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className={`text-sm mb-2 ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                                <span className="font-medium">Votre réponse : </span>
                                                {result.userAnswerText || <span className="italic opacity-70">Aucune réponse</span>}
                                            </p>
                                            {!result.isCorrect && (
                                                <div className="text-sm text-blue-800 bg-blue-50 border border-blue-300 rounded-lg px-3 py-2">
                                                    <span className="font-medium">✅ Réponse attendue : </span>
                                                    {result.correctAnswerText}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Mode solo ────────────────────────────────────────────────────────────
    return (
        <QuizResults
            quizTitle={payload.quizTitle}
            quizId={quizId}
            score={payload.score}
            totalPoints={payload.totalPoints}
            questionResults={payload.questionResults}
            isOwnQuiz={payload.isOwnQuiz}
            isAuthenticated={authStatus === 'authenticated'}
            onRestart={handleRestart}
        />
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingScreen({ text }: { text: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg">{text}</p>
            </div>
        </div>
    );
}

function LobbyWaitingRoom({ score, totalPoints, leaderboard, playerProgress, totalPlayers, currentUserId }: {
    score: number;
    totalPoints: number;
    leaderboard: LeaderboardEntry[];
    playerProgress: ReturnType<typeof useQuizResult>['playerProgress'];
    totalPlayers: number;
    currentUserId?: string;
}) {
    const finishedCount = leaderboard.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">

                <div className="bg-white rounded-xl shadow-2xl p-8 mb-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Quiz terminé !</h1>
                    <p className="text-gray-500">En attente des autres joueurs…</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-4 flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Ton score</span>
                    <span className="text-2xl font-bold text-blue-600">
                        {score} <span className="text-base text-gray-400 font-normal">/ {totalPoints} pts</span>
                    </span>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800">Joueurs</h2>
                        <span className="text-sm text-gray-500">{finishedCount} / {totalPlayers || '?'} terminé{finishedCount > 1 ? 's' : ''}</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: totalPlayers ? `${(finishedCount / totalPlayers) * 100}%` : '0%' }}
                        />
                    </div>

                    <div className="space-y-4">
                        {leaderboard.map((entry) => (
                            <div key={entry.userId} className="flex items-center gap-3">
                                <span className="text-green-500 text-lg w-6 text-center">✓</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">
                                            {entry.username}
                                            {entry.userId === currentUserId && <span className="text-gray-400 text-xs ml-1">(moi)</span>}
                                        </span>
                                        <span className="text-sm font-bold text-green-600">{entry.totalScore} pts</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-green-400 h-1.5 rounded-full w-full" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {playerProgress
                            .filter(p => !leaderboard.find(l => l.userId === p.userId))
                            .map((player) => {
                                const pct = player.totalQuestions > 0 ? (player.currentQuestion / player.totalQuestions) * 100 : 0;
                                return (
                                    <div key={player.userId} className="flex items-center gap-3">
                                        <div className="w-6 flex justify-center">
                                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-600">{player.username}</span>
                                                <span className="text-xs text-gray-400">{player.currentQuestion}/{player.totalQuestions}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-blue-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
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
