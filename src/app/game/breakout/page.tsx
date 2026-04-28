'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBreakout } from '@/hooks/useBreakout';
import SoloGameOverlay from '@/components/SoloGameOverlay';
import { W, H } from '@/lib/breakout/constants';

const POWER_LEGEND = [
    { bonus: true,  src: '/breakout/bonus/WI.png', label: 'Palette large',   desc: '+50% largeur' },
    { bonus: true,  src: '/breakout/bonus/SL.png', label: 'Ralenti',         desc: 'Balle ×0.65' },
    { bonus: true,  src: '/breakout/bonus/ST.png', label: 'Colle',           desc: 'Balle adhère' },
    { bonus: true,  src: '/breakout/bonus/LZ.png', label: 'Laser',           desc: 'Tir sur clic' },
    { bonus: true,  src: '/breakout/bonus/MB.png', label: 'Multi-balle',     desc: '+2 balles' },
    { bonus: true,  src: '/breakout/bonus/UP.png', label: 'Vie',             desc: '+1 vie' },
    { bonus: true,  src: '/breakout/bonus/BM.png', label: 'Bombe',           desc: 'Détruit 9 briques' },
    { bonus: false, src: '/breakout/malus/NR.png', label: 'Palette étroite', desc: '−30% largeur' },
    { bonus: false, src: '/breakout/malus/FS.png', label: 'Accélération',    desc: 'Balle ×1.5' },
];

function PowerLegend() {
    return (
        <div className="w-full max-w-[400px] md:max-w-none md:w-44 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Pilules
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                {POWER_LEGEND.map(({ bonus, src, label, desc }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${bonus ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <Image src={src} alt={label} width={24} height={24} className="object-contain" />
                        </span>
                        <div className="min-w-0">
                            <div className={`text-[11px] font-semibold leading-tight truncate ${bonus ? 'text-gray-700 dark:text-gray-300' : 'text-red-500 dark:text-red-400'}`}>
                                {label}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                                {desc}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BreakoutPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        phase,
        displayScore,
        displayLives,
        displayLevel,
        bestScore,
        isNewBest,
        submitState,
        startGame,
        session,
    } = useBreakout(canvasRef);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-6 pb-12 px-4">
            <div className="w-full max-w-[440px] md:max-w-[620px] flex items-center justify-between mb-4">
                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">← Accueil</Link>
                <span className="text-gray-900 dark:text-white font-bold text-lg">Breakout</span>
                <Link href="/leaderboard/breakout" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">Classement →</Link>
            </div>

            <div className="w-full max-w-[440px] md:max-w-[620px] grid grid-cols-4 mb-3 px-1">
                <div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Score</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{displayScore}</div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Niveau</div>
                    <div className="text-2xl font-black text-cyan-500 dark:text-cyan-400 tabular-nums">{displayLevel}</div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Vies</div>
                    <div className="text-2xl font-black text-pink-500 dark:text-pink-400 tabular-nums">{displayLives}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Meilleur</div>
                    <div className="text-2xl font-black text-amber-500 dark:text-amber-400 tabular-nums">{Math.max(bestScore, displayScore)}</div>
                </div>
            </div>

            {/* Canvas + légende côte à côte sur desktop */}
            <div className="flex flex-col md:flex-row items-start gap-4 w-full max-w-[620px]">
                <div className="relative rounded-xl overflow-hidden shadow-lg w-full max-w-[400px] mx-auto md:mx-0 shrink-0">
                    <canvas
                        ref={canvasRef}
                        width={W}
                        height={H}
                        className="block w-full"
                        style={{ touchAction: 'none', background: '#0f172a' }}
                    />

                    <SoloGameOverlay
                        phase={phase}
                        displayScore={displayScore}
                        displayLevel={displayLevel}
                        isNewBest={isNewBest}
                        submitState={submitState}
                        session={session}
                        leaderboardHref="/leaderboard/breakout"
                        onReplay={startGame}
                        title="Game Over"
                        titleClassName="text-cyan-400"
                        replayClassName="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl transition-all"
                    />
                </div>

                {/* Légende desktop — visible uniquement md+ */}
                <div className="hidden md:block pt-1">
                    <PowerLegend />
                </div>
            </div>

            {phase === 'idle' && (
                <div className="mt-4 flex flex-col items-center gap-3">
                    <button onClick={startGame}
                        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-cyan-900/30">
                        Jouer
                    </button>
                    <p className="text-gray-400 dark:text-gray-600 text-xs">Souris / glisser · Flèches/QD sur clavier</p>
                </div>
            )}

            {phase === 'playing' && (
                <div className="md:hidden mt-4 w-full max-w-[400px] h-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1 select-none touch-none">
                    <span className="text-2xl opacity-40">← →</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Glissez pour déplacer · Tap pour lancer</span>
                </div>
            )}

            {/* Légende mobile — toujours visible, en dessous */}
            <div className="md:hidden mt-4 w-full max-w-[400px]">
                <PowerLegend />
            </div>
        </div>
    );
}
