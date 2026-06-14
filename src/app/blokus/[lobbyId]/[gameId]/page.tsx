'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useBlokus, isBot } from '@/hooks/useBlokus';
import BlokusBoard from '@/components/Blokus/Board';
import { COLORS } from '@/components/Blokus/pieces';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import SurrenderButton from '@/components/SurrenderButton';
import GamePageHeader from '@/components/GamePageHeader';
import GameOverModal from '@/components/GameOverModal';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function BlokusPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound } = useGamePage();
    const myElo = useEloUpdate('blokus', me.userId);

    const { players, state, myColorIndex, isMyTurn, vsBot, inactivityUserId, inactivityEndsAt, move, surrender } = useBlokus({
        lobbyId,
        userId: me.userId,
        onNotFound: () => setIsNotFound(true),
    });

    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!state || state.phase === 'waiting') return (
        <GameWaitingScreen gameType="blokus" gameName="Blokus" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    const turnName = players.find(p => p.colorIndex === state.currentTurn)?.username ?? '…';
    const turnIsBot = isBot(players.find(p => p.colorIndex === state.currentTurn));

    // classement final par score décroissant
    const ranking = [...players].sort((a, b) => state.scores[b.colorIndex] - state.scores[a.colorIndex]);
    const myRank = ranking.findIndex(p => p.colorIndex === myColorIndex);
    const iWon = state.phase === 'finished' && myRank === 0;

    const PlayerTag = ({ colorIndex }: { colorIndex: number }) => {
        const p = players.find(pl => pl.colorIndex === colorIndex);
        if (!p) return null;
        const active = state.phase === 'playing' && state.currentTurn === colorIndex;
        const warn = inactivityUserId === p.userId ? inactivityEndsAt : null;
        return (
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${active ? 'ring-1 ring-amber-400 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="inline-block w-3 h-3 rounded-sm border border-black/30" style={{ background: COLORS[colorIndex] }} />
                {isBot(p) ? <CpuChipIcon className="w-3.5 h-3.5" /> : null}
                <span className="max-w-[6rem] truncate">{p.username}</span>
                <span className="text-[10px] opacity-70">· {state.scores[colorIndex]}</span>
                {state.passed[colorIndex] && state.phase === 'playing' && <span className="text-[10px] text-red-400">·fini</span>}
                {warn && <span className="text-red-500">⏳</span>}
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col wood-table text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="blokus" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Blokus{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span></>}
                center={<div className="flex items-center gap-1.5 flex-wrap justify-center">{players.map(p => <PlayerTag key={p.colorIndex} colorIndex={p.colorIndex} />)}</div>}
                right={state.phase === 'playing' && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase === 'playing' && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={isMyTurn ? 'À toi de jouer' : turnIsBot ? 'Le bot réfléchit…' : `Tour de ${turnName}`}
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-3 min-w-0">
                <div className="flex-1 flex justify-center min-w-0 w-full">
                    {myColorIndex !== null && (
                        <BlokusBoard state={state} myColorIndex={myColorIndex} isMyTurn={isMyTurn} onMove={move} />
                    )}
                </div>
                <GameLogSidebar entries={state.log ?? []} />
            </main>

            {state.phase === 'finished' && (
                <GameOverModal
                    asModal
                    elo={myElo}
                    icon={<TrophyIcon className={`w-8 h-8 ${iWon ? 'text-amber-500' : 'text-gray-400'}`} />}
                    title={iWon ? 'Victoire !' : `${myRank + 1}ᵉ place`}
                    subtitle={`Tu poses ${state.scores[myColorIndex ?? 0]} cases`}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    lobbyLabel="Rejouer"
                    onLeave={() => router.push('/')}
                >
                    <ol className="space-y-1.5 mt-1">
                        {ranking.map((p, i) => (
                            <li key={p.colorIndex} className={`flex items-center gap-2 text-sm ${p.colorIndex === myColorIndex ? 'font-bold' : ''}`}>
                                <span className="w-5 text-right opacity-60">{i + 1}.</span>
                                <span className="inline-block w-3 h-3 rounded-sm border border-black/30" style={{ background: COLORS[p.colorIndex] }} />
                                {isBot(p) && <CpuChipIcon className="w-3.5 h-3.5 text-indigo-400" />}
                                <span className="flex-1 truncate">{p.username}</span>
                                <span className="tabular-nums">{state.scores[p.colorIndex]} cases</span>
                            </li>
                        ))}
                    </ol>
                </GameOverModal>
            )}
        </div>
    );
}
