// src/hooks/useQuizResult.ts
'use client';

import { useEffect, useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getQuizSocket } from '@/lib/socket';
import { QuestionResult } from '@/components/Quiz/QuizResults';

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
    questionResults: QuestionResult[];
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

    const router = useRouter();
    const { data: session, status } = useSession();
    // Support both /quiz/[id]/result (solo) and /quiz/[id]/[quizId]/result (multiplayer)
    // In solo: params.id = quizId. In multiplayer: params.id = lobbyId, params.quizId = quizId
    const quizId =
        typeof params.quizId === 'string'
            ? params.quizId
            : (params.id as string);

    const lobbyCode =
        typeof params.quizId === 'string'
            ? (params.id as string)
            : null;
    const [isHost, setIsHost] = useState(false);

    const [payload, setPayload] = useState<ResultPayload | null>(null);

    useEffect(() => {
        if (!quizId) return;
        try {
            const raw = sessionStorage.getItem(`quiz_result_${quizId}`);
            if (raw) setPayload(JSON.parse(raw));
        } catch { }
    }, [quizId]);

    // Ajouter ce useEffect (indépendant du lobbyCode)
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.quizId !== quizId) return;
            try {
                const raw = sessionStorage.getItem(`quiz_result_${quizId}`);
                if (raw) setPayload(JSON.parse(raw));
            } catch { }
        };
        window.addEventListener('quiz:result:ready', handler);
        return () => window.removeEventListener('quiz:result:ready', handler);
    }, [quizId]);

    useEffect(() => {
        return () => { sessionStorage.removeItem(`quiz_result_${quizId}`); };
    }, [quizId]);

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [allFinished, setAllFinished] = useState(false);

    const socket = useMemo(() => getQuizSocket(), []);

    useEffect(() => {
        if (!lobbyCode || !session?.user?.id) return;

        const onLeaderboard = ({ leaderboard: lb, totalPlayers: total, allFinished: done }: {
            leaderboard: LeaderboardEntry[];
            totalPlayers: number;
            allFinished: boolean;
        }) => {
            setTotalPlayers(total);
            setLeaderboard(lb);
            if (done || total === 0) setAllFinished(true);
        };

        const onProgress = (progress: PlayerProgress[]) => {
            setPlayerProgress(progress);
        };

        const onLobbyState = ({ hostId }: { hostId: string }) => {
            setIsHost(hostId === session?.user?.id);
        };

        if (!socket) return;

        socket.on('game:leaderboard', onLeaderboard);
        socket.on('game:progress', onProgress);
        socket.on('lobby:state', onLobbyState);

        socket.on('lobby:redirectTo', ({ newLobbyId }) => {
            router.push(`/lobby/create/${newLobbyId}`);
        });

        socket.emit('quiz:rejoin', {
            lobbyId: lobbyCode,
            userId: session.user.id,
            username: session.user.username ?? session.user.email ?? 'User',
        });

        return () => {
            socket.off('game:leaderboard', onLeaderboard);
            socket.off('game:progress', onProgress);
            socket.off('lobby:state', onLobbyState);
        };
    }, [lobbyCode, socket, session?.user?.id, session?.user?.username, session?.user?.email]);

    const handleRestart = () => {
        router.push(`/quiz/${quizId}${lobbyCode ? `?lobby=${lobbyCode}` : ''}`);
    };

    return {
        quizId,
        lobbyCode,
        session,
        authStatus: status,
        payload,
        notFound: false,
        leaderboard,
        playerProgress,
        totalPlayers,
        allFinished,
        isHost,
        handleRestart,
    };
}
