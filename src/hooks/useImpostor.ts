// src/hooks/useImpostor.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getImpostorSocket } from '@/lib/socket';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoundState = 'WAITING' | 'WRITING' | 'REVEAL' | 'VOTING' | 'IMPOSTOR_GUESS' | 'END';
export type Role = 'player' | 'impostor';
export type Player = { id: string; name: string };
export type Clue = { playerId: string; playerName: string; text: string };

export type GameEndPayload = {
    winner: 'players' | 'impostor';
    impostorId: string;
    impostorName: string;
    word: string;
    scores: Record<string, number>;
    votes?: Record<string, string>;
    impostorCaught?: boolean;
    impostorGuess?: string | null;
    impostorGuessCorrect?: boolean;
    allClues?: { round: number; clues: Clue[] }[];
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useImpostor({
    lobbyId,
    userId,
    playerName,
    onNotFound,
}: {
    lobbyId: string;
    userId: string;
    playerName: string;
    onNotFound: () => void;
}) {
    const socket = getImpostorSocket();
    const joinedRef = useRef(false);

    const [players, setPlayers] = useState<Player[]>([]);
    const [role, setRole] = useState<Role | null>(null);
    const [word, setWord] = useState<string | null>(null);
    const [roundState, setRoundState] = useState<RoundState>('WAITING');
    const [currentRound, setCurrentRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(1);

    const [speakingOrder, setSpeakingOrder] = useState<string[]>([]);
    const [currentSpeakerId, setCurrentSpeakerId] = useState<string>('');
    const [clueInput, setClueInput] = useState('');
    const [clueSubmitted, setClueSubmitted] = useState(false);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [cluesThisRound, setCluesThisRound] = useState<Clue[]>([]);
    const [pastCluesByPlayer, setPastCluesByPlayer] = useState<Record<string, string[]>>({});

    const [unmaskCount, setUnmaskCount] = useState(0);
    const [unmaskThreshold, setUnmaskThreshold] = useState(0);
    const [hasVotedUnmask, setHasVotedUnmask] = useState(false);

    const [revealedClues, setRevealedClues] = useState<Clue[]>([]);
    const [isLastRound, setIsLastRound] = useState(false);

    const [votedFor, setVotedFor] = useState<string | null>(null);
    const [votedCount, setVotedCount] = useState(0);

    const [guessInput, setGuessInput] = useState('');
    const [guessSubmitted, setGuessSubmitted] = useState(false);
    const [impostorGuessName, setImpostorGuessName] = useState('');
    const [wordGuessResult, setWordGuessResult] = useState<{ guess: string; correct: boolean; word: string } | null>(null);

    const [gameEnd, setGameEnd] = useState<GameEndPayload | null>(null);
    const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
    const [timerDuration, setTimerDuration] = useState(60);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    function startTimer(seconds: number) {
        setTimerDuration(seconds);
        setTimerEndsAt(Date.now() + seconds * 1000);
    }

    useEffect(() => {
        if (!socket || !userId || !lobbyId) return;
        if (joinedRef.current) return;
        joinedRef.current = true;

        socket.emit('impostor:join', { lobbyId, userId, playerName });

        socket.on('notFound', onNotFound);
        socket.on('impostor:players', ({ players }: { players: Player[] }) => setPlayers(players));

        socket.on('impostor:gameStart', ({ role, word, players, totalRounds, speakingOrder }: {
            role: Role; word: string | null; players: Player[]; totalRounds: number; speakingOrder: string[];
        }) => {
            setRole(role);
            setWord(word);
            setPlayers(players);
            setTotalRounds(totalRounds);
            setSpeakingOrder(speakingOrder);
            setPastCluesByPlayer({});
        });

        socket.on('impostor:writingPhase', ({ round, totalRounds, speakingOrder, players }: {
            round: number; totalRounds: number; speakingOrder: string[]; players: Player[];
        }) => {
            setCurrentRound(round);
            setTotalRounds(totalRounds);
            setSpeakingOrder(speakingOrder);
            setPlayers(players);
            setClueInput('');
            setClueSubmitted(false);
            setSubmittedCount(0);
            setCluesThisRound([]);
            setUnmaskCount(0);
            setUnmaskThreshold(0);
            setHasVotedUnmask(false);
            setRoundState('WRITING');
        });

        socket.on('impostor:speakerTurn', ({ speakerId, index, total, timePerRound }: {
            speakerId: string; speakerName: string; index: number; total: number; timePerRound: number;
        }) => {
            setCurrentSpeakerId(speakerId);
            setSubmittedCount(index);
            setClueInput('');
            setClueSubmitted(false);
            startTimer(timePerRound ?? 60);
            void total;
        });

        socket.on('impostor:clueSubmitted', ({ playerId, playerName: pName, text, submittedCount: sc }: {
            playerId: string; playerName: string; text: string; submittedCount: number;
        }) => {
            setSubmittedCount(sc);
            setCluesThisRound(prev => [...prev, { playerId, playerName: pName, text }]);
        });

        socket.on('impostor:cluesRevealed', ({ clues, isLastRound: last }: {
            round: number; totalRounds: number; clues: Clue[]; isLastRound: boolean;
        }) => {
            setRevealedClues(clues);
            setIsLastRound(last);
            setPastCluesByPlayer(prev => {
                const next = { ...prev };
                for (const c of clues) {
                    if (c.text) next[c.playerId] = [...(next[c.playerId] ?? []), c.text];
                }
                return next;
            });
            setRoundState('REVEAL');
            setTimerEndsAt(null);
        });

        socket.on('impostor:unmaskVoteUpdate', ({ count, threshold }: {
            count: number; threshold: number; voters: string[];
        }) => {
            setUnmaskCount(count);
            setUnmaskThreshold(threshold);
        });

        socket.on('impostor:votingPhase', ({ players: ps, round, timePerRound }: {
            players: Player[]; round: number; timePerRound: number;
        }) => {
            setPlayers(ps);
            setCurrentRound(round);
            setVotedFor(null);
            setVotedCount(0);
            setRoundState('VOTING');
            startTimer(timePerRound ?? 60);
        });

        socket.on('impostor:voteUpdate', ({ votedCount: vc }: { votedCount: number }) => setVotedCount(vc));

        socket.on('impostor:guessPhase', ({ impostorName }: { impostorId: string; impostorName: string }) => {
            setImpostorGuessName(impostorName);
            setGuessInput('');
            setGuessSubmitted(false);
            setRoundState('IMPOSTOR_GUESS');
            startTimer(30);
        });

        socket.on('impostor:wordGuessResult', (payload: { guess: string; correct: boolean; word: string }) => {
            setWordGuessResult(payload);
        });

        socket.on('impostor:finished', (payload: GameEndPayload) => {
            setTimerEndsAt(null);
            setGameEnd(payload);
            setRoundState('END');
        });

        socket.on('impostor:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; username: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });

        socket.on('impostor:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });

        socket.on('impostor:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('impostor:players');
            socket.off('impostor:gameStart');
            socket.off('impostor:writingPhase');
            socket.off('impostor:speakerTurn');
            socket.off('impostor:clueSubmitted');
            socket.off('impostor:cluesRevealed');
            socket.off('impostor:unmaskVoteUpdate');
            socket.off('impostor:votingPhase');
            socket.off('impostor:voteUpdate');
            socket.off('impostor:guessPhase');
            socket.off('impostor:wordGuessResult');
            socket.off('impostor:finished');
            socket.off('impostor:inactivityWarning');
            socket.off('impostor:playerKicked');
            socket.off('impostor:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, userId, lobbyId]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const submitClue = useCallback(() => {
        if (!clueInput.trim()) return;
        setClueSubmitted(true);
        socket?.emit('impostor:submitClue', { lobbyId, text: clueInput.trim() });
    }, [socket, lobbyId, clueInput]);

    const requestUnmask = useCallback(() => {
        setHasVotedUnmask(true);
        socket?.emit('impostor:requestUnmask', { lobbyId });
    }, [socket, lobbyId]);

    const vote = useCallback((targetId: string) => {
        setVotedFor(targetId);
        socket?.emit('impostor:vote', { lobbyId, targetId });
    }, [socket, lobbyId]);

    const guessWord = useCallback(() => {
        if (!guessInput.trim()) return;
        setGuessSubmitted(true);
        socket?.emit('impostor:guessWord', { lobbyId, guess: guessInput.trim() });
    }, [socket, lobbyId, guessInput]);

    const surrender = useCallback(() => {
        socket?.emit('impostor:surrender');
    }, [socket]);

    return {
        players,
        role,
        word,
        roundState,
        currentRound,
        totalRounds,
        speakingOrder,
        currentSpeakerId,
        clueInput,
        setClueInput,
        clueSubmitted,
        submittedCount,
        cluesThisRound,
        pastCluesByPlayer,
        unmaskCount,
        unmaskThreshold,
        hasVotedUnmask,
        revealedClues,
        isLastRound,
        votedFor,
        votedCount,
        guessInput,
        setGuessInput,
        guessSubmitted,
        impostorGuessName,
        wordGuessResult,
        gameEnd,
        timerEndsAt,
        timerDuration,
        inactivityUserId,
        inactivityEndsAt,
        submitClue,
        requestUnmask,
        vote,
        guessWord,
        surrender,
    };
}
