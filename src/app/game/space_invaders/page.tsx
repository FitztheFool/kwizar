'use client';

import { useRef, useState } from 'react';
import { StarIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useSpaceInvaders } from '@/hooks/useSpaceInvaders';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';
import AdminDebugControl from '@/components/SoloGame/AdminDebugControl';
import { gameThemeVars } from '@/lib/theme/games';

export default function SpaceInvadersPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [debugLevel, setDebugLevel] = useState(1);
    const {
        phase, displayScore, bestScore, globalBest, isNewBest, submitState, session,
        lives, wave, startGame, canvasSize,
    } = useSpaceInvaders(canvasRef, debugLevel);

    const isAdmin = session?.user?.role === 'ADMIN';

    return (
        <div style={gameThemeVars('space_invaders')} className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">
            <SoloGameHeader game="space_invaders" title="INVADERS" ornament="▾▾▾" />

            <div className="w-full max-w-[420px] mb-2 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<StarIcon className="w-3 h-3 text-yellow-500" />} label="SCORE" value={displayScore} color="text-gray-900 dark:text-white" align="left" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            <div className="w-full max-w-[420px] mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-white/40">
                <span className="flex items-center gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <HeartIcon key={i} className={`w-4 h-4 ${i < lives ? 'text-rose-500' : 'text-gray-300 dark:text-white/10'}`} />
                    ))}
                </span>
                <span className="font-bold tracking-widest uppercase">Vague {wave}</span>
            </div>

            <div className="relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-game-glow">
                <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="block w-full bg-[#0a0a14]" style={{ touchAction: 'none' }} />

                <SoloGameOverlay
                    game="space_invaders"
                    phase={phase}
                    displayScore={displayScore}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    onReplay={() => startGame(debugLevel)}
                    title="Game Over"
                />
            </div>

            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-4">
                    {isAdmin && <AdminDebugControl value={debugLevel} onChange={setDebugLevel} />}
                    <button onClick={() => startGame(debugLevel)}
                        className="px-10 py-4 bg-game hover:brightness-110 hover:shadow-game-glow active:scale-95 text-black font-black text-lg rounded-2xl transition-all">
                        JOUER
                    </button>
                    <p className="text-gray-400 dark:text-white/25 text-xs tracking-wide text-center">
                        ← → / A-D ou glissez le doigt · tir automatique
                    </p>
                </div>
            )}

        </div>
    );
}
