'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useComplot } from '@/hooks/useComplot';
import ComplotBoard from '@/components/Complot/Board';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import SurrenderButton from '@/components/SurrenderButton';
import GamePageHeader from '@/components/GamePageHeader';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon } from '@heroicons/react/24/outline';

const PCOLOR = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

export default function ComplotPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound } = useGamePage();
    const myElo = useEloUpdate('complot', me.userId);

    const { state, players, myIndex, inactivityUserId, inactivityEndsAt, action, passReact, challenge, block, challengeBlock, lose, exchange, surrender } = useComplot({
        lobbyId, userId: me.userId, onNotFound: () => setIsNotFound(true),
    });

    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!state) return (
        <GameWaitingScreen gameType="complot" gameName="Complot" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    const winnerName = state.winner != null ? players.find(p => p.colorIndex === state.winner)?.username : null;
    const iWon = state.winner === myIndex;

    // classement final par placement (1 = gagnant). On l'estime depuis l'état serveur via influence/alive.
    const ranking = [...players].sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.influence - a.influence);

    return (
        <div className="flex-1 flex flex-col wood-table text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="complot" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Complot</span></>}
                center={<div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[60vw]">
                    {players.map(p => (
                        <span key={p.colorIndex} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${state.currentTurn === p.colorIndex && state.phase === 'action' ? 'ring-1 ring-amber-400 bg-amber-100 dark:bg-amber-900/40' : 'text-gray-500 dark:text-gray-400'} ${!p.alive ? 'opacity-50 line-through' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PCOLOR[p.colorIndex] }} />
                            <span className="max-w-[5rem] truncate">{p.username}</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">{p.coins}●</span>
                        </span>
                    ))}
                </div>}
                right={state.phase !== 'finished' && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase !== 'finished' && state.turnDuration > 0 && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={`${state.deckCount} cartes au paquet`}
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-3 min-w-0">
                <div className="flex-1 flex justify-center min-w-0 w-full">
                    <ComplotBoard state={state} myIndex={myIndex} fns={{ action, passReact, challenge, block, challengeBlock, lose, exchange }} />
                </div>
                <GameLogSidebar entries={state.log ?? []} />
            </main>

            {state.phase === 'finished' && (
                <GameOverModal
                    asModal
                    elo={myElo}
                    icon={<TrophyIcon className={`w-8 h-8 ${iWon ? 'text-amber-500' : 'text-gray-400'}`} />}
                    title={iWon ? 'Victoire !' : `${winnerName ?? 'Quelqu\'un'} gagne !`}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={ranking.map((p) => ({
                            userId: p.userId,
                            username: p.username,
                            score: p.alive ? 'Survivant' : 'Éliminé',
                        }))}
                    />
                </GameOverModal>
            )}
        </div>
    );
}
