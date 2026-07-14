'use client';

import { useRef } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useTetris } from '@/hooks/useTetris';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import { W, H } from '@/lib/tetris/constants';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';
import { gameThemeVars } from '@/lib/theme/games';

export default function TetrisPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        phase,
        displayScore,
        displayLevel,
        displayLines,
        bestScore,
        globalBest,
        isNewBest,
        submitState,
        startGame,
        session,
    } = useTetris(canvasRef);

    return (
        <div style={gameThemeVars('tetris')} className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">

            {/* ── Header ── */}
            <SoloGameHeader game="tetris" title="TETRIS" ornament="▼▼" />

            {/* ── Stats bar ── */}
            <div className="w-full max-w-[440px] mb-4 grid grid-cols-5 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<StarIcon className="w-3 h-3 text-yellow-500" />}   label="SCORE"    value={displayScore}                       color="text-gray-900 dark:text-white" />
                <StatCell icon={<TetrominoIcon />}                                  label="NIVEAU"   value={displayLevel}                       color="text-purple-600 dark:text-purple-400" />
                <StatCell icon={<LinesIcon />}                                      label="LIGNES"   value={displayLines}                       color="text-cyan-600 dark:text-cyan-400" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            {/* ── Canvas ── */}
            <div
                className="relative rounded-2xl overflow-hidden shadow-game-glow"
            >
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="block"
                    style={{ touchAction: 'none', maxHeight: 'calc(100dvh - 220px)', width: 'auto' }}
                />

                <SoloGameOverlay
                    game="tetris"
                    phase={phase}
                    displayScore={displayScore}
                    displayLevel={displayLevel}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    onReplay={startGame}
                />
            </div>

            {/* ── Idle play button ── */}
            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-3">
                    <button
                        onClick={startGame}
                        className="flex items-center gap-3 px-10 py-4 bg-game hover:brightness-110 hover:shadow-game-glow active:scale-95 text-black font-black text-lg rounded-2xl transition-all duration-150"
                    >
                        <TetrisBlockIcon />
                        JOUER
                    </button>
                    <p className="text-gray-400 dark:text-white/25 text-xs tracking-wide text-center">
                        ← → déplacer · ↑ / Z tourner · ↓ descendre · Espace chute rapide
                    </p>
                </div>
            )}

            {/* ── Mobile controls hint ── */}
            {phase === 'playing' && (
                <div className="md:hidden mt-4 w-full max-w-[440px] h-16 rounded-2xl border border-gray-200 dark:border-white/[0.06] flex flex-col items-center justify-center gap-1 select-none touch-none">
                    <span className="text-xl text-gray-300 dark:text-white/15">← Tap → · ↓ chute</span>
                    <span className="text-[11px] text-gray-400 dark:text-white/15">Tap = rotation · Glisser = déplacer</span>
                </div>
            )}
        </div>
    );
}

function TetrominoIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="0" y="4" width="4" height="4" rx="1" fill="#c084fc" />
            <rect x="4" y="4" width="4" height="4" rx="1" fill="#c084fc" />
            <rect x="4" y="0" width="4" height="4" rx="1" fill="#c084fc" />
            <rect x="8" y="4" width="4" height="4" rx="1" fill="#c084fc" />
        </svg>
    );
}

function LinesIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="0" y="0" width="12" height="2.5" rx="1" fill="#22d3ee" />
            <rect x="0" y="4.5" width="12" height="2.5" rx="1" fill="#22d3ee" />
            <rect x="0" y="9" width="12" height="2.5" rx="1" fill="#22d3ee" />
        </svg>
    );
}

function TetrisBlockIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="10" width="7" height="7" rx="1.5" fill="black" />
            <rect x="9" y="10" width="7" height="7" rx="1.5" fill="black" />
            <rect x="9" y="3" width="7" height="7" rx="1.5" fill="black" />
            <rect x="2" y="3" width="7" height="7" rx="1.5" fill="black" />
        </svg>
    );
}
