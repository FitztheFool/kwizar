'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoloGame } from '@/hooks/useSoloGame';
import {
    emptyGrid, withMines, revealCell, toggleFlag, countFlags, MINES, type Grid,
} from '@/lib/demineur/engine';

const STARTERS = new Set([' ', 'Enter']);

export function useDemineur() {
    const solo = useSoloGame({
        gameKey: 'demineur',
        gameType: 'DEMINEUR',
        submitEndpoint: '/api/demineur/submit',
        localStorageKey: 'demineurBest',
        starters: STARTERS,
    });

    const [grid, setGrid] = useState<Grid>(emptyGrid);
    const [flagMode, setFlagMode] = useState(false);
    const minedRef = useRef(false);

    const startGame = useCallback(() => {
        setGrid(emptyGrid());
        setFlagMode(false);
        minedRef.current = false;
        solo.resetForStart();
    }, [solo]);

    useEffect(() => { solo.startGameRef.current = startGame; }, [startGame, solo.startGameRef]);

    const reveal = useCallback((r: number, c: number) => {
        if (solo.phase !== 'playing') return;
        setGrid(prev => {
            const base = minedRef.current ? prev : withMines(prev, r, c);
            minedRef.current = true;
            const res = revealCell(base, r, c);
            solo.setDisplayScore(res.revealed);
            // Defer endGame so React finishes this state update first.
            if (res.exploded || res.won) queueMicrotask(() => solo.endGame(res.revealed));
            return res.grid;
        });
    }, [solo]);

    const flag = useCallback((r: number, c: number) => {
        if (solo.phase !== 'playing') return;
        setGrid(prev => toggleFlag(prev, r, c));
    }, [solo.phase]);

    /** Clic/tap sur une case : révèle, ou pose un drapeau si le mode drapeau est actif. */
    const cellAction = useCallback((r: number, c: number) => {
        if (flagMode) flag(r, c); else reveal(r, c);
    }, [flagMode, flag, reveal]);

    const minesLeft = MINES - countFlags(grid);

    return { ...solo, grid, flagMode, setFlagMode, minesLeft, startGame, reveal, flag, cellAction };
}
