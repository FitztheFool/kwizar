'use client';

import { useRef, useState } from 'react';
import { usePacman } from '@/hooks/usePacman';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import { COLS, ROWS, CELL } from '@/lib/pacman/constants';
import { StarIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/solid';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';
import AdminDebugControl from '@/components/SoloGame/AdminDebugControl';

export default function PacmanPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [debugLevel, setDebugLevel] = useState(1);
    const {
        phase,
        displayScore,
        displayLives,
        displayLevel,
        bestScore,
        globalBest,
        isNewBest,
        submitState,
        startGame,
        session,
    } = usePacman(canvasRef, debugLevel);

    const isAdmin = session?.user?.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">

            {/* ── Header ── */}
            <SoloGameHeader leaderboardHref="/leaderboard/pacman">
                <span className="text-blue-500/40 text-xs tracking-widest">•••</span>
                <span
                    className="text-yellow-500 dark:text-yellow-400 font-arcade text-base sm:text-lg uppercase"
                    style={{
                        textShadow: '0 0 20px rgba(250,204,21,0.5), 0 0 40px rgba(250,204,21,0.2)',
                    }}
                >
                    PAC-MAN
                </span>
                <span className="text-blue-500/40 text-xs tracking-widest">•••</span>
            </SoloGameHeader>

            {/* ── Stats bar ── */}
            <div className="w-full max-w-[440px] mb-4 grid grid-cols-5 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<StarIcon className="w-3 h-3 text-yellow-500" />} label="SCORE" value={displayScore} color="text-gray-900 dark:text-white" />
                <StatCell icon={<SparklesIcon className="w-3 h-3 text-blue-500" />} label="NIVEAU" value={displayLevel} color="text-blue-500 dark:text-blue-400" />
                <StatCell icon={<HeartIcon className="w-3 h-3 text-rose-500" />} label="VIES" value={displayLives} color="text-rose-500 dark:text-rose-400" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            {/* ── Canvas ── */}
            <div
                className="relative w-full max-w-[440px] rounded-2xl overflow-hidden"
                style={{
                    boxShadow: '0 0 0 1px rgba(59,130,246,0.25), 0 0 40px rgba(59,130,246,0.12)',
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={COLS * CELL}
                    height={ROWS * CELL}
                    className="block w-full"
                    style={{ touchAction: 'none', background: '#000' }}
                />

                <SoloGameOverlay
                    phase={phase}
                    displayScore={displayScore}
                    displayLevel={displayLevel}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    leaderboardHref="/leaderboard/pacman"
                    onReplay={() => startGame(debugLevel)}
                    title="Game Over"
                    titleClassName="text-yellow-400"
                    replayClassName="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm rounded-xl transition-all"
                />
            </div>

            {/* ── Play button ── */}
            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-3">
                    {isAdmin && <AdminDebugControl value={debugLevel} onChange={setDebugLevel} />}
                    <button
                        onClick={() => startGame(debugLevel)}
                        className="group relative flex items-center gap-3 px-10 py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black font-black text-lg rounded-2xl transition-all duration-150"
                        style={{ boxShadow: '0 4px 24px rgba(250,204,21,0.35), 0 0 0 0 rgba(250,204,21,0)' }}
                    >
                        <PacmanIcon />
                        JOUER
                    </button>
                    <p className="flex items-center gap-2 text-gray-400 dark:text-white/25 text-xs tracking-wide">
                        <ArrowIcon />
                        Flèches ou Z, Q, S, D pour jouer
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

function PacmanIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
                d="M10 10 L18.5 5.8 A9 9 0 1 0 18.5 14.2 Z"
                fill="black"
            />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-60">
            <path d="M7 1v12M1 7h12M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    );
}
