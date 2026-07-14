'use client';

import { useRef } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useFlappyBird } from '@/hooks/useFlappyBird';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';
import { gameThemeVars } from '@/lib/theme/games';

export default function FlappyBirdPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { phase, displayScore, bestScore, globalBest, isNewBest, submitState, session, startGame, canvasSize } = useFlappyBird(canvasRef);

    return (
        <div style={gameThemeVars('flappy_bird')} className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">
            <SoloGameHeader game="flappy_bird" title="FLAPPY" ornament="~~" />

            <div className="w-full max-w-[360px] mb-4 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<StarIcon className="w-3 h-3 text-yellow-500" />} label="SCORE" value={displayScore} color="text-gray-900 dark:text-white" align="left" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            <div className="relative w-full max-w-[360px] rounded-2xl overflow-hidden shadow-game-glow">
                <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="block w-full" style={{ touchAction: 'none' }} />

                <SoloGameOverlay
                    game="flappy_bird"
                    phase={phase}
                    displayScore={displayScore}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    onReplay={startGame}
                    title="Game Over"
                />
            </div>

            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-4">
                    <button onClick={startGame}
                        className="px-10 py-4 bg-game hover:brightness-110 hover:shadow-game-glow active:scale-95 text-black font-black text-lg rounded-2xl transition-all">
                        JOUER
                    </button>
                    <p className="text-gray-400 dark:text-white/25 text-xs tracking-wide text-center">
                        Espace · ↑ · ou tapez sur la zone de jeu pour battre des ailes
                    </p>
                </div>
            )}
        </div>
    );
}
