'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';
import { QuestionResult } from '@/components/QuizResults';

export interface ResultPayload {
    score: number;
    totalPoints: number;
    quizTitle: string;
    isOwnQuiz: boolean;
    questionResults: QuestionResult[];
    lobbyCode: string | null;
}

export interface LeaderboardEntry {
    userId: string;
    username: string;
    totalScore: number;
}

export interface PlayerProgress {
    userId: string;
    username: string;
    currentQuestion: number;
    totalQuestions: number;
    finished: boolean;
}

export function useQuizResult() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const quizId = params?.id as string;
    const lobbyCodeFromUrl = searchParams.get('lobby');

    // Lecture synchrone au premier rendu — évite les problèmes de double montage
    // en Strict Mode où le cleanup d'un useEffect supprimerait le sessionStorage
    // avant la seconde exécution
    const [payload] = useState<ResultPayload | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(`quiz_result_${quizId}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    // Supprime le sessionStorage au démontage
    useEffect(() => {
        return () => { sessionStorage.removeItem(`quiz_result_${quizId}`); };
    }, [quizId]);

    const lobbyCode = lobbyCodeFromUrl ?? payload?.lobbyCode ?? null;

    // ─── Lobby socket ──────────────────────────────────────────────────────────
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [allFinished, setAllFinished] = useState(false);

    const socket = useMemo(() => getSocket(), []);

    useEffect(() => {
        if (!lobbyCode || !session?.user?.id) return;

        const onLeaderboard = ({ leaderboard: lb, totalPlayers: total, allFinished: done }: {
            leaderboard: LeaderboardEntry[];
            totalPlayers: number;
            allFinished: boolean;
        }) => {
            setTotalPlayers(total);
            setLeaderboard(lb);
            if (done) setAllFinished(true);
        };

        const onProgress = (progress: PlayerProgress[]) => setPlayerProgress(progress);

        socket.on('game:leaderboard', onLeaderboard);
        socket.on('game:progress', onProgress);

        // Rejoint la room lobby (le socket l'a quittée en naviguant vers /quiz)
        // puis demande l'état actuel
        socket.emit('lobby:rejoin', {
            lobbyId: lobbyCode,
            userId: session.user.id,
            username: session.user.username ?? session.user.email ?? 'User',
        });
        socket.emit('lobby:getLeaderboard');

        return () => {
            socket.off('game:leaderboard', onLeaderboard);
            socket.off('game:progress', onProgress);
        };
    }, [lobbyCode, socket, session?.user?.id, session?.user?.username, session?.user?.email]);

    // ─── Actions ───────────────────────────────────────────────────────────────
    const handleRestart = () => {
        router.push(`/quiz/${quizId}${lobbyCode ? `?lobby=${lobbyCode}` : ''}`);
    };

    return {
        quizId,
        lobbyCode,
        session,
        authStatus: status,
        payload,
        notFound: payload === null,
        leaderboard,
        playerProgress,
        totalPlayers,
        allFinished,
        handleRestart,
    };
}
