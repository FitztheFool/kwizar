'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useSixQuiPrend, isBot } from '@/hooks/useSixQuiPrend';
import SixBoard from '@/components/SixQuiPrend/Board';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import SurrenderButton from '@/components/SurrenderButton';
import GamePageHeader from '@/components/GamePageHeader';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, CpuChipIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function SixQuiPrendPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound } = useGamePage();
    const myElo = useEloUpdate('six_qui_prend', me.userId);

    const { players, state, myColorIndex, vsBot, inactivityUserId, inactivityEndsAt, chooseCard, chooseRow, surrender } = useSixQuiPrend({
        lobbyId,
        userId: me.userId,
        onNotFound: () => setIsNotFound(true),
    });

    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!state || state.phase === 'selecting' && state.deal === 0) return (
        <GameWaitingScreen gameType="six_qui_prend" gameName="6 qui prend!" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    // classement (moins de têtes = mieux)
    const ranking = [...players].sort((a, b) => state.penalty[a.colorIndex] - state.penalty[b.colorIndex]);
    const myRank = ranking.findIndex(p => p.colorIndex === myColorIndex);
    const iWon = state.phase === 'finished' && myRank === 0;

    const PlayerTag = ({ p }: { p: typeof players[number] }) => {
        const chose = state.selectedMask[p.colorIndex];
        const isChooser = state.phase === 'choosingRow' && state.chooser === p.colorIndex;
        return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${isChooser ? 'ring-1 ring-rose-400 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200' : 'text-gray-500 dark:text-gray-400'}`}>
                {isBot(p) ? <CpuChipIcon className="w-3.5 h-3.5" /> : null}
                <span className="max-w-[5rem] truncate">{p.username}</span>
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{state.penalty[p.colorIndex]}🐮</span>
                {state.phase === 'selecting' && chose && <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />}
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col wood-table text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="six_qui_prend" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">6 qui prend!{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span></>}
                center={<div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[60vw]">{players.map(p => <PlayerTag key={p.colorIndex} p={p} />)}</div>}
                right={state.phase !== 'finished' && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase !== 'finished' && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={`Manche ${state.deal} · tour ${state.turn}/10 · ${Math.max(...state.penalty)}/${state.threshold}🐮`}
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-3 min-w-0">
                <div className="flex-1 flex justify-center min-w-0 w-full">
                    <SixBoard state={state} onChooseCard={chooseCard} onChooseRow={chooseRow} />
                </div>
                <GameLogSidebar entries={state.log ?? []} />
            </main>

            {state.phase === 'finished' && (
                <GameOverModal
                    asModal
                    elo={myElo}
                    icon={<TrophyIcon className={`w-8 h-8 ${iWon ? 'text-amber-500' : 'text-gray-400'}`} />}
                    title={iWon ? 'Victoire !' : `${myRank + 1}ᵉ place`}
                    subtitle={`Tu finis avec ${state.penalty[myColorIndex ?? 0]} têtes de bœuf`}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={ranking.map((p) => ({
                            userId: p.userId,
                            username: p.username,
                            score: `${state.penalty[p.colorIndex]} 🐮`,
                            badges: isBot(p) ? ['Bot'] : [],
                        }))}
                    />
                </GameOverModal>
            )}
        </div>
    );
}
