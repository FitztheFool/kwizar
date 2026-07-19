'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoloGame } from '@/hooks/useSoloGame';
import {
    generatePuzzle, cellScore, finalScore, MAX_LIVES,
    type Puzzle, type Difficulty,
} from '@/lib/sudoku/engine';

const STARTERS = new Set(['Enter']);

export function useSudoku() {
    const solo = useSoloGame({
        gameKey: 'sudoku',
        gameType: 'SUDOKU',
        submitEndpoint: '/api/sudoku/submit',
        localStorageKey: 'sudokuBest',
        starters: STARTERS,
    });

    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [values, setValues] = useState<number[]>(() => new Array(81).fill(0)); // saisies du joueur
    const [notes, setNotes] = useState<number[]>(() => new Array(81).fill(0));   // bitmask 1<<v
    const [selected, setSelected] = useState<number | null>(null);
    const [noteMode, setNoteMode] = useState(false);
    const [lives, setLives] = useState(MAX_LIVES);
    const [elapsed, setElapsed] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
    const difficultyRef = useRef<Difficulty>('moyen');
    const startedAtRef = useRef(0);

    const startGame = useCallback((diff?: Difficulty) => {
        const d = diff ?? difficultyRef.current;
        difficultyRef.current = d;
        setDifficulty(d);
        setPuzzle(generatePuzzle(d));
        setValues(new Array(81).fill(0));
        setNotes(new Array(81).fill(0));
        setSelected(null);
        setNoteMode(false);
        setLives(MAX_LIVES);
        setElapsed(0);
        startedAtRef.current = Date.now();
        solo.resetForStart();
    }, [solo]);

    useEffect(() => { solo.startGameRef.current = () => startGame(); }, [startGame, solo.startGameRef]);

    // Chrono (le bonus de fin utilise startedAtRef, l'état sert à l'affichage).
    useEffect(() => {
        if (solo.phase !== 'playing') return;
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
        return () => clearInterval(id);
    }, [solo.phase]);

    /** Une case est verrouillée si c'est un indice ou une saisie déjà juste. */
    const isLocked = useCallback((i: number): boolean => {
        if (!puzzle) return true;
        return puzzle.givens[i] !== 0 || values[i] === puzzle.solution[i];
    }, [puzzle, values]);

    // Saisie calculée hors des updaters fonctionnels : les effets (vies, fin de
    // partie) ne doivent s'exécuter qu'une fois même si React rejoue les updaters.
    const input = useCallback((v: number) => {
        if (solo.phase !== 'playing' || !puzzle || selected === null || isLocked(selected)) return;

        if (noteMode) {
            const nextNotes = [...notes];
            nextNotes[selected] ^= 1 << v;
            setNotes(nextNotes);
            return;
        }

        const next = [...values];
        next[selected] = v;
        setValues(next);

        if (v === puzzle.solution[selected]) {
            const nextNotes = [...notes];
            nextNotes[selected] = 0;
            setNotes(nextNotes);

            const correct = next.filter((val, i) => puzzle.givens[i] === 0 && val === puzzle.solution[i]).length;
            solo.setDisplayScore(cellScore(correct, puzzle.difficulty));

            const complete = puzzle.givens.every((g, i) => g !== 0 || next[i] === puzzle.solution[i]);
            if (complete) {
                const secs = (Date.now() - startedAtRef.current) / 1000;
                solo.endGame(finalScore(correct, puzzle.difficulty, secs));
            }
        } else {
            const left = lives - 1;
            setLives(left);
            if (left <= 0) {
                const correct = next.filter((val, i) => puzzle.givens[i] === 0 && val === puzzle.solution[i]).length;
                solo.endGame(cellScore(correct, puzzle.difficulty));
            }
        }
    }, [solo, puzzle, selected, noteMode, isLocked, values, notes, lives]);

    const erase = useCallback(() => {
        if (solo.phase !== 'playing' || selected === null || isLocked(selected)) return;
        const nextValues = [...values];
        nextValues[selected] = 0;
        setValues(nextValues);
        const nextNotes = [...notes];
        nextNotes[selected] = 0;
        setNotes(nextNotes);
    }, [solo.phase, selected, isLocked, values, notes]);

    // Clavier : chiffres, effacement, déplacement, bascule notes.
    useEffect(() => {
        if (solo.phase !== 'playing') return;
        const handle = (e: KeyboardEvent) => {
            if (e.key >= '1' && e.key <= '9') { input(Number(e.key)); return; }
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { e.preventDefault(); erase(); return; }
            if (e.key === 'n' || e.key === 'N') { setNoteMode(m => !m); return; }
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                setSelected(prev => {
                    const cur = prev ?? 0;
                    if (e.key === 'ArrowUp') return cur >= 9 ? cur - 9 : cur;
                    if (e.key === 'ArrowDown') return cur < 72 ? cur + 9 : cur;
                    if (e.key === 'ArrowLeft') return cur % 9 > 0 ? cur - 1 : cur;
                    return cur % 9 < 8 ? cur + 1 : cur;
                });
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [solo.phase, input, erase]);

    /** Occurrences posées (indices + saisies justes) de chaque chiffre, pour griser le pavé. */
    const digitCounts = new Array<number>(10).fill(0);
    if (puzzle) {
        for (let i = 0; i < 81; i++) {
            const v = puzzle.givens[i] !== 0 ? puzzle.givens[i] : (values[i] === puzzle.solution[i] ? values[i] : 0);
            if (v) digitCounts[v]++;
        }
    }

    return {
        ...solo,
        puzzle, values, notes, selected, setSelected, noteMode, setNoteMode,
        lives, elapsed, difficulty, digitCounts,
        startGame, input, erase, isLocked,
    };
}
