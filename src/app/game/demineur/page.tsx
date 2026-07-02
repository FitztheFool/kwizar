'use client';

import { FlagIcon } from '@heroicons/react/24/solid';
import { useDemineur } from '@/hooks/useDemineur';
import { MINES, SAFE_CELLS, type Cell } from '@/lib/demineur/engine';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import SoloGameHeader from '@/components/SoloGame/SoloGameHeader';
import StatCell from '@/components/SoloGame/StatCell';
import BestScores from '@/components/SoloGame/BestScores';

// Couleurs classiques des chiffres du démineur (1..8).
const NUM_COLOR = ['', 'text-blue-600', 'text-green-600', 'text-red-600', 'text-indigo-700', 'text-amber-700', 'text-teal-600', 'text-gray-700', 'text-gray-500'];

function CellView({ cell, onReveal, onFlag }: { cell: Cell; onReveal: () => void; onFlag: () => void }) {
    const base = 'aspect-square flex items-center justify-center font-black text-[11px] sm:text-sm leading-none select-none rounded-[2px] transition-colors';

    if (!cell.revealed) {
        return (
            <button
                onClick={onReveal}
                onContextMenu={(e) => { e.preventDefault(); onFlag(); }}
                className={`${base} bg-slate-300 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500 active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_2px_0_rgba(255,255,255,0.1)]`}
            >
                {cell.flagged && <FlagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />}
            </button>
        );
    }
    // Révélée
    return (
        <div className={`${base} bg-slate-100 dark:bg-slate-800 ${cell.mine ? 'bg-red-500 dark:bg-red-600' : ''} ${cell.adjacent ? NUM_COLOR[cell.adjacent] : ''}`}>
            {cell.mine ? '💣' : cell.adjacent > 0 ? cell.adjacent : ''}
        </div>
    );
}

export default function DemineurPage() {
    const { grid, phase, displayScore, bestScore, globalBest, isNewBest, submitState, session,
        flagMode, setFlagMode, minesLeft, startGame, reveal, flag } = useDemineur();

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center pt-4 pb-14 px-4">
            <SoloGameHeader leaderboardHref="/leaderboard/demineur">
                <span className="text-slate-400/40 text-xs tracking-widest">▮▮</span>
                <span className="text-slate-700 dark:text-slate-200 font-black text-3xl tracking-[0.05em]">DÉMINEUR</span>
                <span className="text-slate-400/40 text-xs tracking-widest">▮▮</span>
            </SoloGameHeader>

            <div className="w-full max-w-[420px] mb-4 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] bg-gray-200 dark:bg-white/[0.04]">
                <StatCell icon={<FlagIcon className="w-3 h-3 text-red-500" />} label="MINES" value={minesLeft} color="text-gray-900 dark:text-white" align="left" />
                <BestScores me={Math.max(bestScore, displayScore)} global={Math.max(globalBest, displayScore)} />
            </div>

            <div className="relative w-full max-w-[520px]">
                <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-0.5 p-1.5 rounded-2xl bg-slate-400 dark:bg-slate-700 select-none">
                    {grid.map((row, r) =>
                        row.map((cell, c) => (
                            <CellView
                                key={`${r}-${c}`}
                                cell={cell}
                                onReveal={() => (flagMode ? flag(r, c) : reveal(r, c))}
                                onFlag={() => flag(r, c)}
                            />
                        )),
                    )}
                </div>

                <SoloGameOverlay
                    phase={phase}
                    displayScore={displayScore}
                    isNewBest={isNewBest}
                    submitState={submitState}
                    session={session}
                    leaderboardHref="/leaderboard/demineur"
                    onReplay={startGame}
                    title={displayScore >= SAFE_CELLS ? 'Gagné !' : 'Boum 💥'}
                    titleClassName={displayScore >= SAFE_CELLS ? 'text-green-400' : 'text-red-400'}
                    bgClassName="bg-black/80 backdrop-blur-sm rounded-2xl"
                    replayClassName="px-5 py-2.5 bg-slate-200 hover:bg-white text-slate-900 font-bold text-sm rounded-xl transition-all"
                    leaderboardClassName="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl transition-all"
                />
            </div>

            {phase === 'playing' && (
                <button
                    onClick={() => setFlagMode(m => !m)}
                    className={`mt-4 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${flagMode
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                    <FlagIcon className="w-4 h-4" />
                    {flagMode ? 'Mode drapeau ACTIF' : 'Mode drapeau'}
                </button>
            )}

            {phase === 'idle' && (
                <div className="mt-6 flex flex-col items-center gap-4">
                    <button onClick={startGame}
                        className="px-10 py-4 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black text-lg rounded-2xl transition-all"
                        style={{ boxShadow: '0 4px 24px rgba(51,65,85,0.35)' }}>
                        JOUER
                    </button>
                    <p className="text-gray-500 dark:text-white/30 text-xs tracking-wide text-center">
                        {MINES} mines · clic = révéler · clic droit / mode drapeau = marquer
                    </p>
                </div>
            )}
        </div>
    );
}
