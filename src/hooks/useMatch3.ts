'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoloGame } from '@/hooks/useSoloGame';
import { newBoard, trySwap, hasAnyMove, adjacent, type Board } from '@/lib/match3/engine';

const STARTERS = new Set([' ', 'Enter']);
export const START_TIME = 90;        // secondes au départ
export const MAX_TIME = 99;          // plafond (le bonus ne dépasse pas ça)
const TIME_PER_POINT = 0.05;         // +secondes par point gagné (gros combos = plus de temps)

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
    const [timeLeft, setTimeLeft] = useState(START_TIME);

    const boardRef = useRef(board);
    const selectedRef = useRef<Cell | null>(null);
    const scoreRef = useRef(0);
    const deadlineRef = useRef(0);

    useEffect(() => { boardRef.current = board; }, [board]);
    useEffect(() => { selectedRef.current = selected; }, [selected]);

    const startGame = useCallback(() => {
        const b = newBoard();
        boardRef.current = b;
        setBoard(b);
        setSelected(null);
        setTimeLeft(START_TIME);
        scoreRef.current = 0;
        deadlineRef.current = Date.now() + START_TIME * 1000;
        solo.resetForStart();
    }, [solo]);

    useEffect(() => { solo.startGameRef.current = startGame; }, [startGame, solo.startGameRef]);

    // Chrono : fin de partie quand le temps (rallongé par les combos) est épuisé.
    useEffect(() => {
        if (solo.phase !== 'playing') return;
        const id = setInterval(() => {
            const left = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
            setTimeLeft(Math.ceil(left));
            if (left <= 0) { clearInterval(id); solo.endGame(scoreRef.current); }
        }, 200);
        return () => clearInterval(id);
    }, [solo.phase, solo]);

    const select = useCallback((r: number, c: number) => {
        if (solo.phase !== 'playing') return;
        const prev = selectedRef.current;

        if (!prev) { setSelected({ r, c }); return; }
        if (prev.r === r && prev.c === c) { setSelected(null); return; }
        if (!adjacent(prev.r, prev.c, r, c)) { setSelected({ r, c }); return; }

        const next = boardRef.current.map(row => [...row]);
        const gained = trySwap(next, prev.r, prev.c, r, c);
        setSelected(null);
        if (gained < 0) return;                              // coup illégal

        scoreRef.current += gained;
        solo.setDisplayScore(scoreRef.current);
        // bonus de temps proportionnel au score du coup (cascades = plus), plafonné
        deadlineRef.current = Math.min(
            deadlineRef.current + gained * TIME_PER_POINT * 1000,
            Date.now() + MAX_TIME * 1000,
        );

        const board2 = hasAnyMove(next) ? next : newBoard();  // plus de coup → remélange
        boardRef.current = board2;
        setBoard(board2);
    }, [solo]);

    return {
        ...solo,
        board,
        selected,
        timeLeft,
        startGame,
        select,
    };
}
