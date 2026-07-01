'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useGameEnabledGuard } from '@/hooks/useGameEnabledGuard';
import GameUnavailable from '@/components/GameUnavailable';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useTanks, isBot } from '@/hooks/useTanks';
import TanksBoard from '@/components/Tanks/Board';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import SurrenderButton from '@/components/SurrenderButton';
import GamePageHeader from '@/components/GamePageHeader';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import SpectatorBadge from '@/components/SpectatorBadge';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, XCircleIcon, CpuChipIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

export default function TanksPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound } = useGamePage();
    const gameGuard = useGameEnabledGuard('tanks');
    const myElo = useEloUpdate('tanks', me.userId);

    const { players, state, shot, clearShot, myColorIndex, isMyTurn, spectator, vsBot, inactivityUserId, inactivityEndsAt, fire, move, surrender } = useTanks({
        lobbyId, userId: me.userId, username: me.username ?? '', onNotFound: () => setIsNotFound(true),
    });

    if (gameGuard === 'disabled') return <GameUnavailable />;
    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!state || state.phase === 'waiting') return (
        <GameWaitingScreen gameType="tanks" gameName="Tanks" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    const myEloResult = myElo?.find(e => e.userId === me.userId) ?? null;
    const winnerPlayer = state.winner !== null ? players.find(p => p.colorIndex === state.winner) : null;
    const iWon = state.winner === myColorIndex;
    const turnName = players.find(p => p.colorIndex === state.currentTurn)?.username ?? '…';
    const turnIsBot = isBot(players.find(p => p.colorIndex === state.currentTurn));

    const PlayerTag = ({ idx }: { idx: 0 | 1 }) => {
        const p = players.find(pl => pl.colorIndex === idx);
        if (!p) return null;
        const active = state.phase === 'playing' && state.currentTurn === idx;
        const hp = state.tanks[idx]?.hp ?? 0;
        return (
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${active ? 'ring-1 ring-lime-400 bg-lime-100 dark:bg-lime-900/40 text-lime-800 dark:text-lime-200' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: idx === 0 ? '#2563eb' : '#dc2626' }} />
                {isBot(p) ? <CpuChipIcon className="w-3.5 h-3.5" /> : null}
                <span className="max-w-[6rem] truncate">{p.username}</span>
                <span className="text-[10px] opacity-80 inline-flex items-center gap-0.5">{hp}<HeartIcon className="w-3 h-3 text-red-500" /></span>
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="tanks" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Tanks{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span>{spectator && <SpectatorBadge className="ml-2" />}</>}
                center={<div className="flex items-center gap-2"><PlayerTag idx={0} /><span className="text-gray-400 text-xs">vs</span><PlayerTag idx={1} /></div>}
                right={state.phase === 'playing' && !spectator && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase === 'playing' && state.turnDuration > 0 && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={isMyTurn ? 'À toi de tirer' : turnIsBot ? 'Le bot vise…' : `Tour de ${turnName}`}
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-3 min-w-0">
                <div className="flex-1 flex justify-center min-w-0 w-full">
                    {(myColorIndex !== null || spectator) && (
                        <TanksBoard state={state} myColorIndex={myColorIndex ?? 0} isMyTurn={isMyTurn} shot={shot} onClearShot={clearShot} onFire={fire} onMove={move} />
                    )}
                </div>
                <GameLogSidebar entries={state.log ?? []} />
            </main>

            {state.phase === 'finished' && (
                <GameOverModal
                    asModal
                    elo={spectator ? null : myElo}
                    icon={spectator ? <EyeIcon className="w-8 h-8 text-purple-400" /> : iWon ? <TrophyIcon className="w-8 h-8 text-amber-500" /> : isBot(winnerPlayer) ? <CpuChipIcon className="w-8 h-8 text-indigo-400" /> : <XCircleIcon className="w-8 h-8 text-red-400" />}
                    title={spectator ? 'Vous avez observé cette partie' : iWon ? 'Victoire !' : isBot(winnerPlayer) ? 'Le bot gagne !' : `${winnerPlayer?.username ?? 'Adversaire'} gagne !`}
                    reason={state.reason}
                    subtitle={!spectator && myEloResult ? `${myEloResult.delta >= 0 ? '+' : ''}${myEloResult.delta} ELO · ${myEloResult.after}` : undefined}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={[0, 1].map(i => players.find(p => p.colorIndex === i))
                            .filter((p): p is typeof players[number] => !!p)
                            .sort((a, b) => state.scores[b.colorIndex] - state.scores[a.colorIndex])
                            .map((p) => {
                                const isWinner = p.colorIndex === state.winner;
                                const loserBySurrender = !isWinner && state.reason === 'surrender';
                                const loserByAfk = !isWinner && state.reason === 'afk';
                                const score = state.scores[p.colorIndex];
                                return {
                                    userId: p.userId,
                                    username: p.username,
                                    score: `${score} victoire${score !== 1 ? 's' : ''}`,
                                    badges: [
                                        ...(isBot(p) ? ['Bot'] : []),
                                        ...(loserBySurrender ? ['Abandon'] : []),
                                        ...(loserByAfk ? ['AFK'] : []),
                                    ],
                                    disqualified: loserBySurrender || loserByAfk,
                                };
                            })}
                    />
                </GameOverModal>
            )}
        </div>
    );
}
