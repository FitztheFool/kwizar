'use client';

import { StarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useMatch3 } from '@/hooks/useMatch3';
import { SIZE } from '@/lib/match3/engine';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';
import { gameThemeVars } from '@/lib/theme/games';

// 6 gemmes : couleur + forme (lisible pour daltoniens).
const GEMS: { bg: string; glyph: string }[] = [
    { bg: 'bg-rose-500', glyph: '◆' },
    { bg: 'bg-amber-400', glyph: '●' },
    { bg: 'bg-emerald-500', glyph: '▲' },
    { bg: 'bg-sky-500', glyph: '■' },
    { bg: 'bg-violet-500', glyph: '★' },
    { bg: 'bg-fuchsia-400', glyph: '⬢' },
];

export default function Match3Page() {
    const { board, selected, timeLeft, phase, displayScore, bestScore, globalBest, isNewBest, submitState, session, startGame, select } = useMatch3();

    return (
        <div style={gameThemeVars('match3')} className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">
            <SoloGameHeader game="match3" title="Aligne-3" ornament="◆◆" />

            <div className="w-full max-w-[420px] mb-4 grid grid-cols-4 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<StarIcon className="w-3 h-3 text-yellow-500" />} label="SCORE" value={displayScore} color="text-gray-900 dark:text-white" align="left" />
                <StatCell icon={<ClockIcon className="w-3 h-3 text-sky-500" />} label="TEMPS" value={`${timeLeft}s`} color={timeLeft <= 10 ? 'text-red-500' : 'text-gray-900 dark:text-white'} align="left" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            <div className="relative w-full max-w-[420px]">
                <div className="grid gap-1 p-2 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/60 aspect-square select-none"
                    style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
                    {board.map((row, r) =>
                        row.map((g, c) => {
                            const sel = selected?.r === r && selected?.c === c;
                            const gem = GEMS[g] ?? GEMS[0];
                            return (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => select(r, c)}
                                    disabled={phase !== 'playing'}
                                    className={`rounded-lg flex items-center justify-center text-white font-bold shadow-sm transition-all aspect-square
                                        ${gem.bg}
                                        ${sel ? 'ring-2 ring-white scale-110 z-10' : 'hover:brightness-110'}
                                        ${phase !== 'playing' ? 'cursor-default' : 'cursor-pointer'}`}
                                    style={{ fontSize: 'min(4.5vw, 22px)' }}
                                >
                                    {gem.glyph}
                                </button>
                            );
                        })
                    )}
                </div>

                <SoloGameOverlay
                    game="match3"
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
                        className="px-10 py-4 bg-game hover:brightness-110 hover:shadow-game-glow active:scale-95 text-white font-black text-lg rounded-2xl transition-all">
                        JOUER
                    </button>
                    <p className="text-gray-500 dark:text-white/30 text-xs tracking-wide text-center">
                        Échange 2 gemmes voisines · aligne 3+ · chaque combo rajoute du temps
                    </p>
                </div>
            )}
        </div>
    );
}
