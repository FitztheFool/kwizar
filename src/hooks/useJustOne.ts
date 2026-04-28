// src/hooks/useJustOne.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getJustOneSocket } from '@/lib/socket';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoundState = 'WAITING' | 'WRITE_CLUES' | 'VALIDATE_CLUES' | 'GUESS_PHASE' | 'RESOLUTION' | 'END_GAME';
export type Player = { id: string; name: string };
export type Clue = { playerId: string; value: string; valid: boolean };
export type RoundResult = {
    result: 'CORRECT' | 'LOST' | 'PASS';
    reason?: 'NO_VALID_CLUES' | 'WRONG_GUESS';
    score: number;
    targetWord: string;
};
export type HistoryEntry = RoundResult & { round: number };

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useJustOne({
    lobbyId,
    userId,
    username,
    onNotFound,
}: {
    lobbyId: string;
    userId: string;
    username: string;
    onNotFound: () => void;
}) {
    const socket = useMemo(() => getJustOneSocket(), []);
    const joinedRef = useRef(false);

    const [players, setPlayers] = useState<Player[]>([]);
    const [guesserId, setGuesserId] = useState<string | null>(null);
    const [guesserName, setGuesserName] = useState('');
    const [roundState, setRoundState] = useState<RoundState>('WAITING');
    const [card, setCard] = useState<{ words: string[] } | null>(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(0);
    const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
    const [timerDuration, setTimerDuration] = useState(60);

    const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([]);
    const [myClue, setMyClue] = useState('');
    const [clueSubmitted, setClueSubmitted] = useState(false);

    const [validatedClues, setValidatedClues] = useState<Clue[]>([]);
    const [validClues, setValidClues] = useState<string[]>([]);
    const [myGuess, setMyGuess] = useState('');

    const [lastResult, setLastResult] = useState<RoundResult | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [finalScore, setFinalScore] = useState<{ score: number; level: string } | null>(null);

    const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const isGuesser = guesserId === userId;

    function startTimer(seconds: number) {
        setTimerDuration(seconds);
        setTimerEndsAt(Date.now() + seconds * 1000);
    }

    function stopTimer() {
        setTimerEndsAt(null);
    }

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;
        if (joinedRef.current) return;
        joinedRef.current = true;

        socket.emit('just_one:join', { lobbyId, playerName: username, userId });

        socket.on('notFound', onNotFound);
        socket.on('just_one:players', ({ players: ps }: { players: Player[] }) => setPlayers(ps));

        socket.on('just_one:roundStart', (payload: {
            guesserId: string; guesserName: string; card?: { words: string[] };
        }) => {
            setRound(r => r + 1);
            setRoundState('WAITING');
            setGuesserId(payload.guesserId);
            setGuesserName(payload.guesserName);
            setCard(payload.card ?? null);
            setMyClue('');
            setClueSubmitted(false);
            setSubmittedPlayers([]);
            setValidatedClues([]);
            setValidClues([]);
            setMyGuess('');
            setLastResult(null);
            startTimer(30);
        });

        socket.on('just_one:writeClues', ({ wordIndex }: { wordIndex: number }) => {
            setCurrentWordIndex(wordIndex);
            setRoundState('WRITE_CLUES');
            startTimer(60);
        });

        socket.on('just_one:clueSubmitted', ({ playerId }: { playerId: string }) => {
            setSubmittedPlayers(prev => prev.includes(playerId) ? prev : [...prev, playerId]);
        });

        socket.on('just_one:cluesValidated', ({ allClues }: { allClues: Clue[] }) => {
            setRoundState('VALIDATE_CLUES');
            setValidatedClues(allClues);
            stopTimer();
        });

        socket.on('just_one:guessStart', ({ validClues: vc }: { validClues: string[] }) => {
            setRoundState('GUESS_PHASE');
            setValidClues(vc);
            startTimer(60);
        });

        socket.on('just_one:roundResult', (result: RoundResult) => {
            setRoundState('RESOLUTION');
            setLastResult(result);
            setScore(result.score);
            setHistory(prev => [...prev, { ...result, round: prev.length + 1 }]);
            stopTimer();
        });

        socket.on('just_one:finished', (payload: { score: number; level: string }) => {
            setRoundState('END_GAME');
            setFinalScore(payload);
            stopTimer();
        });

        socket.on('just_one:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; username: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });

        socket.on('just_one:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });

        socket.on('just_one:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('just_one:players');
            socket.off('just_one:roundStart');
            socket.off('just_one:writeClues');
            socket.off('just_one:clueSubmitted');
            socket.off('just_one:cluesValidated');
            socket.off('just_one:guessStart');
            socket.off('just_one:roundResult');
            socket.off('just_one:finished');
            socket.off('just_one:inactivityWarning');
            socket.off('just_one:playerKicked');
            socket.off('just_one:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const pickWord = useCallback((wordIndex: number) => {
        socket?.emit('just_one:pickWord', { lobbyId, wordIndex });
    }, [socket, lobbyId]);

    const submitClue = useCallback(() => {
        if (!myClue.trim()) return;
        socket?.emit('just_one:submitClue', { lobbyId, clue: myClue.trim() });
        setClueSubmitted(true);
    }, [socket, lobbyId, myClue]);

    const submitGuess = useCallback((guess: string | null) => {
        socket?.emit('just_one:submitGuess', { lobbyId, guess });
    }, [socket, lobbyId]);

    const surrender = useCallback(() => {
        socket?.emit('just_one:surrender');
    }, [socket]);

    return {
        players,
        guesserId,
        guesserName,
        roundState,
        card,
        score,
        round,
        timerEndsAt,
        timerDuration,
        submittedPlayers,
        myClue,
        setMyClue,
        clueSubmitted,
        validatedClues,
        validClues,
        myGuess,
        setMyGuess,
        lastResult,
        history,
        finalScore,
        currentWordIndex,
        inactivityUserId,
        inactivityEndsAt,
        isGuesser,
        pickWord,
        submitClue,
        submitGuess,
        surrender,
    };
}
