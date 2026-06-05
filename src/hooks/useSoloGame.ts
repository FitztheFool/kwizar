'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type Phase = 'idle' | 'playing' | 'over';
export type SubmitState = 'idle' | 'loading' | 'done' | 'error';

export function useSoloGame({
    gameKey,
    gameType,
    submitEndpoint,
    localStorageKey,
    starters,
    allowZeroScore = false,
}: {
    gameKey: string;
    gameType: string;
    submitEndpoint: string;
    localStorageKey: string;
    starters: Set<string>;
    /** Submit attempts even when the final score is 0 (default: skip). */
    allowZeroScore?: boolean;
}) {
    const { data: session } = useSession();

    const phaseRef    = useRef<Phase>('idle');
    const startGameRef = useRef<() => void>(() => {});
    const gameIdRef   = useRef('');
    // Resolves to the signed server token once /api/solo/start responds
    const tokenRef    = useRef<Promise<string> | null>(null);
    // Timestamp of the last endGame — used to swallow key auto-repeat that would
    // otherwise instantly restart the game before the player can read the result.
    const overSinceRef = useRef(0);

    const [phase, setPhase]             = useState<Phase>('idle');
    const [displayScore, setDisplayScore] = useState(0);
    const [bestScore, setBestScore]     = useState(0);
    const [globalBest, setGlobalBest]   = useState(0);
    const [isNewBest, setIsNewBest]     = useState(false);
    const [submitState, setSubmitState] = useState<SubmitState>('idle');

    // Personal best: localStorage first, then server. Global best (leaderboard
    // top) is fetched from the same endpoint and shown to everyone, even guests.
    useEffect(() => {
        const local = parseInt(localStorage.getItem(localStorageKey) ?? '0');
        if (!isNaN(local)) setBestScore(local);
    }, [localStorageKey]);

    useEffect(() => {
        fetch(`/api/solo/${gameKey}/best`)
            .then(r => r.json())
            .then(({ best, global }: { best?: number; global?: number }) => {
                if (typeof best === 'number' && best > 0) setBestScore(prev => Math.max(prev, best));
                if (typeof global === 'number') setGlobalBest(global);
            })
            .catch(() => {});
    }, [session, gameKey]);

    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // Keyboard: start game on idle/over
    useEffect(() => {
        if (phase !== 'idle' && phase !== 'over') return;
        const handle = (e: KeyboardEvent) => {
            if (!starters.has(e.key)) return;
            // Always swallow the key first so Space/ArrowUp/etc. never scroll the
            // page — including during the grace period below.
            e.preventDefault();
            // Grace period after end-of-game so the same Enter/Space that
            // ended the round (or its OS-level auto-repeat) doesn't instantly
            // start a new one before the player can see the result.
            if (phase === 'over' && Date.now() - overSinceRef.current < 700) return;
            startGameRef.current();
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [phase, starters]);

    const submitScore = useCallback(async (finalScore: number, extraPayload?: Record<string, unknown>): Promise<boolean> => {
        if (!session?.user || finalScore < 0) return false;
        if (finalScore === 0 && !allowZeroScore) return false;
        setSubmitState('loading');
        try {
            const token = await (tokenRef.current ?? Promise.resolve(''));
            if (!token) { setSubmitState('error'); return false; }
            const res = await fetch(submitEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: finalScore, token, ...extraPayload }),
            });
            setSubmitState(res.ok ? 'done' : 'error');
            return res.ok;
        } catch {
            setSubmitState('error');
            return false;
        }
    }, [session, submitEndpoint, allowZeroScore]);

    const endGame = useCallback((finalScore: number, extraPayload?: Record<string, unknown>) => {
        setPhase('over');
        phaseRef.current = 'over';
        overSinceRef.current = Date.now();
        setDisplayScore(finalScore);
        // Tentative new-best flag (UX). The actual local best is only persisted
        // after the server confirms the attempt, so a rejected submit (e.g.
        // minDurationMs not met) cannot leave a phantom localStorage best.
        setIsNewBest(finalScore > bestScore);

        if (!session?.user) {
            // Guest run — no server side, store locally only.
            if (finalScore > bestScore) {
                localStorage.setItem(localStorageKey, String(finalScore));
                setBestScore(finalScore);
            }
            return;
        }
        submitScore(finalScore, extraPayload).then(ok => {
            if (ok && finalScore > bestScore) {
                localStorage.setItem(localStorageKey, String(finalScore));
                setBestScore(finalScore);
            } else if (!ok) {
                // Revert the tentative new-best badge so the overlay matches
                // what's actually saved.
                setIsNewBest(false);
            }
        });
    }, [submitScore, localStorageKey, bestScore, session]);

    const resetForStart = useCallback(() => {
        gameIdRef.current = crypto.randomUUID();

        // Fetch a signed token from the server immediately — runs in parallel with gameplay.
        // By the time the game ends (≥10 s), the token will be resolved.
        if (session?.user) {
            tokenRef.current = fetch('/api/solo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameType }),
            })
                .then(r => r.json())
                .then(({ token }: { token: string }) => token ?? '')
                .catch(() => '');
        } else {
            tokenRef.current = null;
        }

        setPhase('playing');
        phaseRef.current = 'playing';
        setDisplayScore(0);
        setSubmitState('idle');
        setIsNewBest(false);
    }, [session, gameType]);

    return {
        session,
        phase,
        phaseRef,
        startGameRef,
        gameIdRef,
        displayScore,
        setDisplayScore,
        bestScore,
        globalBest,
        isNewBest,
        submitState,
        endGame,
        resetForStart,
    };
}
