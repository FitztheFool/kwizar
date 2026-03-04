'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import QuizResults, { QuestionResult } from '@/components/QuizResults';

interface ResultPayload {
    score: number;
    totalPoints: number;
    quizTitle: string;
    isOwnQuiz: boolean;
    questionResults: QuestionResult[];
    lobbyCode: string | null;
}

export default function QuizResultPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { status } = useSession();
    const quizId = params?.id as string;
    // lobbyCode peut venir de l'URL (passé par quiz page) ou du payload
    const lobbyCodeFromUrl = searchParams.get('lobby');

    const [payload, setPayload] = useState<ResultPayload | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const raw = sessionStorage.getItem(`quiz_result_${quizId}`);
        if (!raw) { setNotFound(true); return; }
        try {
            setPayload(JSON.parse(raw));
        } catch {
            setNotFound(true);
        }
    }, [quizId]);

    const lobbyCode = lobbyCodeFromUrl ?? payload?.lobbyCode ?? null;

    const handleRestart = () => {
        sessionStorage.removeItem(`quiz_result_${quizId}`);
        router.push(`/quiz/${quizId}${lobbyCode ? `?lobby=${lobbyCode}` : ''}`);
    };

    // ─── Loading ──────────────────────────────────────────────────────────────

    if (status === 'loading' || (!payload && !notFound)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 text-lg">Chargement des résultats...</p>
                </div>
            </div>
        );
    }

    // ─── Résultats introuvables ───────────────────────────────────────────────

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

    // ─── Résultats ────────────────────────────────────────────────────────────

    return (
        <QuizResults
            quizTitle={payload.quizTitle}
            quizId={quizId}
            score={payload.score}
            totalPoints={payload.totalPoints}
            questionResults={payload.questionResults}
            isOwnQuiz={payload.isOwnQuiz}
            isAuthenticated={status === 'authenticated'}
            onRestart={handleRestart}
            // ✅ En mode lobby : bouton pour rejoindre les résultats collectifs
            extraActions={lobbyCode ? [
                {
                    label: '🏆 Classement du lobby',
                    onClick: () => router.push(`/lobby/${lobbyCode}/results`),
                    variant: 'primary',
                }
            ] : []}
        />
    );
}
