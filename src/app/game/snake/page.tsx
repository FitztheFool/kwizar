'use client';

import { useRef } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useSnake } from '@/hooks/useSnake';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import { ColorPicker } from '@/components/Snake/ColorPicker';
import { COLS, ROWS, CELL } from '@/lib/snake/constants';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';

export default function SnakePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        phase,
        displayScore,
        bestScore,
        globalBest,
        isNewBest,
        submitState,
        colorIndex,
        setColorIndex,
        startGame,
        session,
    } = useSnake(canvasRef);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#07070f] flex flex-col items-center pt-4 pb-14 px-4">

            {/* ── Header ── */}
            <SoloGameHeader leaderboardHref="/leaderboard/snake">
                <span className="text-green-600/40 text-xs tracking-widest">~~~</span>
                <span
                    className="text-green-600 dark:text-green-400 font-black text-2xl tracking-[0.15em] uppercase"
                    style={{
                        fontFamily: '"Press Start 2P", "Courier New", monospace',
                        textShadow: '0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.2)',
                    }}
                >
                    SNAKE
                </span>
                <span className="text-green-600/40 text-xs tracking-widest">~~~</span>
            </SoloGameHeader>

            {/* ── Stats bar ── */}
            <div className="w-full max-w-[440px] mb-4 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<StarIcon className="w-3 h-3 text-yellow-500" />}   label="SCORE"    value={displayScore}                      color="text-gray-900 dark:text-white" align="left" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            {/* ── Canvas ── */}
            <div
                className="relative w-full max-w-[440px] rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 0 0 1px rgba(34,197,94,0.2), 0 0 40px rgba(34,197,94,0.08)' }}
            >
                <canvas
                    ref={canvasRef}
                    width={COLS * CELL}
                    height={ROWS * CELL}
                    className="block w-full"
                    style={{ touchAction: 'none' }}
                />

                <SoloGameOverlay
                    phase={phase}
                    displayScore={displayScore}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    leaderboardHref="/leaderboard/snake"
                    onReplay={startGame}
                    bgClassName="bg-black/80 backdrop-blur-sm"
                    scoreClassName="text-white"
                    newBestClassName="text-green-400"
                    replayClassName="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold text-sm rounded-xl transition-all"
                    leaderboardClassName="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl transition-all"
                >
                    <ColorPicker value={colorIndex} onChange={setColorIndex} />
                </SoloGameOverlay>
            </div>

            {/* ── Idle controls ── */}
            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-4">
                    <ColorPicker value={colorIndex} onChange={setColorIndex} />
                    <button
                        onClick={startGame}
                        className="flex items-center gap-3 px-10 py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black font-black text-lg rounded-2xl transition-all duration-150"
                        style={{ boxShadow: '0 4px 24px rgba(250,204,21,0.35)' }}
                    >
                        <SnakeIcon />
                        JOUER
                    </button>
                    <p className="flex items-center gap-2 text-gray-400 dark:text-white/25 text-xs tracking-wide">
                        <ArrowIcon />
                        Glissez sur le plateau · Flèches/ZQSD sur clavier
                    </p>
                </div>
            )}

            {/* ── Mobile swipe zone ── */}
            {phase === 'playing' && (
                <div className="md:hidden mt-4 w-full max-w-[440px] h-20 rounded-2xl border border-gray-200 dark:border-white/[0.06] flex flex-col items-center justify-center gap-1 select-none touch-none">
                    <span className="text-xl text-gray-300 dark:text-white/15">↑ ↓ ← →</span>
                    <span className="text-[11px] text-gray-400 dark:text-white/15">Glissez ici ou n'importe où</span>
                </div>
            )}
        </div>
    );
}

function SnakeIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 10 Q3 4 9 4 Q15 4 15 8 Q15 12 10 12 Q6 12 6 15 Q6 17 9 17"
                stroke="black" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="3" cy="10" r="2" fill="black" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-60">
            <path d="M7 1v12M1 7h12M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
