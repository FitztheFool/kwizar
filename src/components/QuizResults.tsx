'use client';

import Link from 'next/link';
import { plural } from '@/lib/utils';

export interface QuestionResult {
    questionId: string;
    questionText: string;
    type: 'TRUE_FALSE' | 'MCQ' | 'TEXT' | 'MULTI_TEXT';
    points: number;
    earnedPoints: number;
    isCorrect: boolean;
    userAnswerText: string;
    correctAnswerText: string;
    strictOrder?: boolean;
}

export interface QuizResultsProps {
    quizTitle: string;
    quizId: string;
    score: number;
    totalPoints: number;
    questionResults: QuestionResult[];
    /** Affiche le bandeau "ce quiz ne rapporte pas de points" */
    isOwnQuiz?: boolean;
    /** Affiche le bandeau "connectez-vous pour sauvegarder" */
    isAuthenticated?: boolean;
    /** Si fourni, affiche un bouton "Rejouer" */
    onRestart?: () => void;
    /** Boutons d'action supplémentaires */
    extraActions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }[];
}

export default function QuizResults({
    quizTitle,
    quizId,
    score,
    totalPoints,
    questionResults,
    isOwnQuiz = false,
    isAuthenticated = true,
    onRestart,
    extraActions = [],
}: QuizResultsProps) {
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const correctCount = questionResults.filter((r) => r.isCorrect).length;
    const totalCount = questionResults.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

                {/* ── Carte score ── */}
                <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">
                            {percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '📚'}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz terminé !</h2>
                        <p className="text-xl text-gray-600 mb-6">{quizTitle}</p>

                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 mb-6">
                            <p className="text-lg font-semibold opacity-90 mb-1">{score}/{totalPoints} pts</p>
                            <p className="text-5xl font-bold mb-1">
                                {correctCount}/{totalCount}{' '}
                                {plural(totalCount, 'question correcte', 'questions correctes')}
                            </p>
                            <p className="text-base opacity-80">{percentage}% des points obtenus</p>
                        </div>

                        {!isAuthenticated && (
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-5 py-4 mb-6 shadow-sm">
                                <span className="text-xl shrink-0">🔒</span>
                                <p className="text-sm">
                                    Vos scores ne sont enregistrés que lorsque vous êtes connecté.{' '}
                                    <Link
                                        href={`/login?callbackUrl=${encodeURIComponent(`/quiz/${quizId}`)}`}
                                        className="font-semibold underline hover:text-amber-900 transition-colors"
                                    >
                                        Se connecter
                                    </Link>
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center flex-wrap">
                            {onRestart && (
                                <button
                                    onClick={onRestart}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Rejouer
                                </button>
                            )}
                            {extraActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={action.onClick}
                                    className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                                        action.variant === 'primary'
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-gray-600 text-white hover:bg-gray-700'
                                    }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                            <Link href="/dashboard" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                                Dashboard
                            </Link>
                            <Link href="/leaderboard" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                                Classement
                            </Link>
                            <Link href="/" className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium">
                                Accueil
                            </Link>
                        </div>
                    </div>
                </div>

                {isOwnQuiz && (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-300 text-blue-800 rounded-xl px-5 py-4 mb-6 shadow-sm">
                        <span className="text-xl shrink-0">ℹ️</span>
                        <p className="text-sm">Ce quiz étant le vôtre, il ne vous rapporte pas de points au classement.</p>
                    </div>
                )}

                {/* ── Récapitulatif ── */}
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Récapitulatif</h3>
                    <div className="space-y-4">
                        {questionResults.map((result, index) => (
                            <div
                                key={result.questionId}
                                className={`p-5 rounded-xl border-2 ${
                                    result.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <p className="font-semibold text-gray-900">
                                        <span className="text-gray-500 font-normal mr-2">Q{index + 1}.</span>
                                        {result.questionText}
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xl ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.isCorrect ? '✓' : '✗'}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            result.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                        }`}>
                                            {result.earnedPoints > 0 ? `+${result.earnedPoints} pts` : '0 pt'}
                                        </span>
                                    </div>
                                </div>

                                {result.type === 'MULTI_TEXT' ? (
                                    <div className="mt-2">
                                        <div className={`text-sm mb-2 ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                            <span className="font-medium">Votre réponse : </span>
                                            {result.userAnswerText
                                                ? <span>{result.userAnswerText}</span>
                                                : <span className="italic opacity-70">Aucune réponse</span>
                                            }
                                        </div>
                                        <div className="border-2 border-blue-300 bg-blue-50 rounded-lg px-3 py-2">
                                            <p className="text-sm font-medium text-blue-800 mb-2">Réponses attendues :</p>
                                            <div className="space-y-1">
                                                {result.correctAnswerText.split(', ').map((c, i) => {
                                                    const userTexts = result.userAnswerText.split(', ');
                                                    const isGood = userTexts.some(u => u.trim().toLowerCase() === c.trim().toLowerCase());
                                                    return (
                                                        <div key={i} className={`text-sm px-3 py-1.5 rounded-lg border font-medium ${
                                                            isGood ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-blue-200 text-blue-700'
                                                        }`}>
                                                            {isGood ? '✓' : '•'} {c}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={`text-sm mb-2 ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                            <span className="font-medium">Votre réponse : </span>
                                            {result.userAnswerText
                                                ? <span>{result.userAnswerText}</span>
                                                : <span className="italic opacity-70">Aucune réponse</span>
                                            }
                                        </div>
                                        {!result.isCorrect && (
                                            <div className="text-sm text-blue-800 bg-blue-50 border border-blue-300 rounded-lg px-3 py-2">
                                                <span className="font-medium">✅ Réponse attendue : </span>
                                                <span>{result.correctAnswerText}</span>
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
