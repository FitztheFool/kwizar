'use client';

import { HeartIcon, PencilIcon, BackspaceIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useSudoku } from '@/hooks/useSudoku';
import { MAX_LIVES, type Difficulty } from '@/lib/sudoku/engine';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';
import { gameThemeVars } from '@/lib/theme/games';

const DIFFICULTIES: { key: Difficulty; label: string; hint: string }[] = [
    { key: 'facile', label: 'Facile', hint: '38 indices · ×1' },
    { key: 'moyen', label: 'Moyen', hint: '32 indices · ×2' },
    { key: 'difficile', label: 'Difficile', hint: '27 indices · ×3' },
];

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function NotesView({ mask }: { mask: number }) {
    return (
        <div className="grid grid-cols-3 w-full h-full text-[0.42rem] sm:text-[0.55rem] leading-none text-gray-500 dark:text-gray-400">
            {Array.from({ length: 9 }, (_, k) => (
                <span key={k} className="flex items-center justify-center">
                    {(mask & (1 << (k + 1))) !== 0 ? k + 1 : ''}
                </span>
            ))}
        </div>
    );
}

export default function SudokuPage() {
    const { puzzle, values, notes, selected, setSelected, noteMode, setNoteMode,
        lives, elapsed, digitCounts, phase, displayScore, bestScore, globalBest, isNewBest,
        submitState, session, startGame, input, erase, isLocked } = useSudoku();

    const selectedValue = selected !== null && puzzle
        ? (puzzle.givens[selected] !== 0 ? puzzle.givens[selected] : values[selected])
        : 0;

    const cellDisplay = (i: number): { value: number; given: boolean; wrong: boolean } => {
        if (!puzzle) return { value: 0, given: false, wrong: false };
        if (puzzle.givens[i] !== 0) return { value: puzzle.givens[i], given: true, wrong: false };
        const v = values[i];
        return { value: v, given: false, wrong: v !== 0 && v !== puzzle.solution[i] };
    };

    return (
        <div style={gameThemeVars('sudoku')} className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">
            <SoloGameHeader game="sudoku" title="SUDOKU" />

            <div className="w-full max-w-[420px] mb-4 grid grid-cols-4 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell
                    icon={<HeartIcon className="w-3 h-3 text-red-500" />}
                    label="VIES"
                    value={phase === 'playing' ? '❤'.repeat(Math.max(0, lives)) + '·'.repeat(MAX_LIVES - Math.max(0, lives)) : MAX_LIVES}
                    color="text-gray-900 dark:text-white"
                    align="left"
                />
                <StatCell
                    icon={<ClockIcon className="w-3 h-3 text-gray-400" />}
                    label="TEMPS"
                    value={fmtTime(elapsed)}
                    color="text-gray-900 dark:text-white"
                    align="left"
                />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            <div className="relative w-full max-w-[420px]">
                <div className="grid grid-cols-9 aspect-square rounded-xl overflow-hidden border-2 border-gray-800 dark:border-gray-300 bg-gray-800 dark:bg-gray-300 gap-px select-none">
                    {Array.from({ length: 81 }, (_, i) => {
                        const { value, given, wrong } = cellDisplay(i);
                        const r = Math.floor(i / 9), c = i % 9;
                        const isSel = selected === i;
                        const sameUnit = selected !== null && (Math.floor(selected / 9) === r || selected % 9 === c
                            || (Math.floor(Math.floor(selected / 9) / 3) === Math.floor(r / 3) && Math.floor((selected % 9) / 3) === Math.floor(c / 3)));
                        const sameValue = value !== 0 && value === selectedValue && !isSel;
                        // Bordures épaisses des blocs 3×3 (via marges sur fond sombre).
                        const thickR = c === 2 || c === 5 ? 'mr-[2px]' : '';
                        const thickB = r === 2 || r === 5 ? 'mb-[2px]' : '';
                        return (
                            <button
                                key={i}
                                onClick={() => phase === 'playing' && setSelected(i)}
                                className={`relative aspect-square flex items-center justify-center font-bold text-base sm:text-xl leading-none transition-colors ${thickR} ${thickB}
                                    ${isSel ? 'bg-game/30'
                                        : sameValue ? 'bg-game/20'
                                        : sameUnit ? 'bg-gray-100 dark:bg-gray-800'
                                        : 'bg-white dark:bg-gray-900'}
                                    ${wrong ? 'text-red-500'
                                        : given ? 'text-gray-900 dark:text-white'
                                        : 'text-game brightness-90 dark:brightness-125'}`}
                            >
                                {value !== 0 ? value : notes[i] !== 0 ? <NotesView mask={notes[i]} /> : ''}
                            </button>
                        );
                    })}
                </div>

                <SoloGameOverlay
                    game="sudoku"
                    phase={phase}
                    displayScore={displayScore}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    onReplay={() => startGame()}
                    title={lives > 0 ? 'Grille résolue !' : 'Plus de vies 💔'}
                />
            </div>

            {phase === 'playing' && (
                <div className="w-full max-w-[420px] mt-4 flex flex-col gap-2">
                    <div className="grid grid-cols-9 gap-1">
                        {Array.from({ length: 9 }, (_, k) => {
                            const d = k + 1;
                            const done = digitCounts[d] >= 9;
                            return (
                                <button
                                    key={d}
                                    onClick={() => input(d)}
                                    disabled={done}
                                    className={`aspect-square rounded-lg font-black text-lg transition-all active:scale-95
                                        ${done ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:brightness-110'}`}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setNoteMode(m => !m)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95
                                ${noteMode ? 'bg-game text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                        >
                            <PencilIcon className="w-4 h-4" />
                            Notes {noteMode ? 'ON' : 'OFF'}
                        </button>
                        <button
                            onClick={erase}
                            disabled={selected === null || isLocked(selected)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 transition-all active:scale-95"
                        >
                            <BackspaceIcon className="w-4 h-4" />
                            Effacer
                        </button>
                    </div>
                </div>
            )}

            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="flex gap-3">
                        {DIFFICULTIES.map(d => (
                            <button
                                key={d.key}
                                onClick={() => startGame(d.key)}
                                className="px-6 py-4 bg-game hover:brightness-110 hover:shadow-game-glow active:scale-95 text-white font-black rounded-2xl transition-all flex flex-col items-center gap-1"
                            >
                                <span className="text-lg">{d.label}</span>
                                <span className="text-[0.65rem] font-semibold opacity-80">{d.hint}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-gray-500 dark:text-white/30 text-xs tracking-wide text-center">
                        3 vies · 10 pts par case juste × difficulté · bonus de rapidité si la grille est résolue<br />
                        Clavier : 1-9 saisir · flèches se déplacer · N notes · Retour effacer
                    </p>
                </div>
            )}
        </div>
    );
}
