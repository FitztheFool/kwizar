'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoloGame } from '@/hooks/useSoloGame';
import { newBoard, trySwap, hasAnyMove, adjacent, type Board } from '@/lib/match3/engine';

const STARTERS = new Set([' ', 'Enter']);

export interface Cell { r: number; c: number; }

export function useMatch3() {
    const solo = useSoloGame({
        gameKey: 'match3',
        gameType: 'MATCH3',
        submitEndpoint: '/api/match3/submit',
        localStorageKey: 'match3Best',
        starters: STARTERS,
    });

    const [board, setBoard] = useState<Board>(() => newBoard());
    const [selected, setSelected] = useState<Cell | null>(null);
    const scoreRef = useRef(0);

    const startGame = useCallback(() => {
        setBoard(newBoard());
        setSelected(null);
        scoreRef.current = 0;
        solo.resetForStart();
    }, [solo]);

    useEffect(() => { solo.startGameRef.current = startGame; }, [startGame, solo.startGameRef]);

    const select = useCallback((r: number, c: number) => {
        if (solo.phase !== 'playing') return;

        setSelected(prev => {
            if (!prev) return { r, c };
            if (prev.r === r && prev.c === c) return null;            // déselection
            if (!adjacent(prev.r, prev.c, r, c)) return { r, c };     // change de sélection

            // tentative d'échange
            setBoard(b => {
                const next = b.map(row => [...row]);
                const gained = trySwap(next, prev.r, prev.c, r, c);
                if (gained < 0) return b;                             // coup illégal → rien
                scoreRef.current += gained;
                solo.setDisplayScore(scoreRef.current);
                if (!hasAnyMove(next)) queueMicrotask(() => solo.endGame(scoreRef.current));
                return next;
            });
            return null;
        });
    }, [solo]);

    return {
        ...solo,
        board,
        selected,
        startGame,
        select,
    };
}
