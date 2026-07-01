'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useGameEnabledGuard } from '@/hooks/useGameEnabledGuard';
import GameUnavailable from '@/components/GameUnavailable';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useAtlantide, isBot } from '@/hooks/useAtlantide';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import GamePageHeader from '@/components/GamePageHeader';
import SurrenderButton from '@/components/SurrenderButton';
import SpectatorBadge from '@/components/SpectatorBadge';
import AtlantideBoard from '@/components/Atlantide/Board';
import { COLOR_CLASSES, CREATURE_EMOJI, CREATURE_LABELS, LEVEL_LABELS, WHEEL_SPRITE, TOKEN_DEAD_SPRITE } from '@/components/Atlantide/boardLayout';
import PlayerLabel from '@/components/shared/PlayerLabel';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, XCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function AtlantidePage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound, modalDismissed, setModalDismissed } = useGamePage();
    const gameGuard = useGameEnabledGuard('atlantide');
    const myElo = useEloUpdate('atlantide', me.userId);

    const {
        state, currentPlayer, isMyTurn,
        inactivityUserId, inactivityEndsAt,
        place, move, moveBoat, endMove, removeTile, moveCreature, skipCreature, surrender,
    } = useAtlantide({
        lobbyId,
        userId: me.userId,
        username: me.username ?? '',
        onNotFound: () => setIsNotFound(true),
        onModalReset: () => setModalDismissed(false),
    });

    if (gameGuard === 'disabled') return <GameUnavailable />;
    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();
    if (!state || state.phase === 'waiting') return (
        <GameWaitingScreen
            gameType="atlantide"
            gameName="Les Rescapés de l'Atlantide"
            lobbyId={lobbyId}
            players={state?.players.map(p => ({ userId: p.userId, username: p.username })) ?? []}
            myUserId={me.userId}
        />
    );

    const vsBot = state.players.some(p => isBot(p) && p.userId !== me.userId);
    const spectator = !!state.spectator;
    const showSurrender = state.phase !== 'finished' && !spectator;
    const currentIsBot = isBot(currentPlayer);

    const tilesLeft = (level: string) => state.tiles.filter(t => !t.removed && t.level === level).length;

    const winnerLabel = (() => {
        if (state.winner === null) return null;
        const w = state.players[state.winner];
        if (!w) return null;
        return { title: `${w.username} gagne !`, isMe: w.userId === me.userId };
    })();

    const myPlaced = state.players.find(p => p.userId === me.userId)?.placed ?? 0;
    const spinInstruction = state.spin
        ? (state.spin.steps === 'teleport'
            ? `Faites réapparaître ${CREATURE_LABELS[state.spin.animal].toLowerCase()} (ou passez)`
            : `Déplacez ${CREATURE_LABELS[state.spin.animal].toLowerCase()} de ${state.spin.steps} (ou passez)`)
        : 'Tourniquet…';
    const turnLabel = isMyTurn
        ? state.phase === 'placement' ? `Placez vos pions (${myPlaced}/12)`
        : state.phase === 'moving' ? `Déplacez vos pions — ${state.movePoints} pt${state.movePoints > 1 ? 's' : ''} restant${state.movePoints > 1 ? 's' : ''}`
        : state.phase === 'tile' ? 'Choisissez une tuile à engloutir'
        : state.phase === 'spin' ? spinInstruction
        : '…'
        : currentIsBot ? 'Le bot réfléchit…' : `Tour de ${currentPlayer?.username ?? '…'}`;

    return (
        <div className="flex-1 flex flex-col bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-white">
            <GamePageHeader
                left={
                    <>
                        <GameIcon gameType="atlantide" className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        <span className="font-bold">Les Rescapés de l&apos;Atlantide{vsBot && <span className="ml-2 text-xs font-normal text-indigo-400">vs Bot</span>}</span>
                        {spectator && <SpectatorBadge />}
                    </>
                }
                center={
                    <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
                        {state.players.map((p, idx) => (
                            <PlayerLabel
                                key={p.userId}
                                username={`${p.username} (${p.saved}/12)`}
                                active={state.phase !== 'finished' && idx === state.currentTurn}
                                isBot={isBot(p)}
                                bgClass={COLOR_CLASSES[p.colorIndex].bg}
                                dotExtraClass="border border-white shadow-sm"
                                inactivityEndsAt={inactivityUserId === p.userId ? inactivityEndsAt : null}
                            />
                        ))}
                    </div>
                }
                right={showSurrender && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase !== 'finished' && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={turnLabel}
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 p-4">
                <AtlantideBoard
                    state={state}
                    myUserId={me.userId}
                    isMyTurn={isMyTurn}
                    onPlace={place}
                    onMove={move}
                    onMoveBoat={moveBoat}
                    onRemoveTile={removeTile}
                    onMoveCreature={moveCreature}
                />

                <div className="flex flex-col items-center gap-4 min-w-[180px]">
                    {/* Points de déplacement */}
                    {state.phase === 'moving' && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className={`w-3.5 h-3.5 rounded-full border border-white/60 ${i < state.movePoints ? 'bg-amber-400' : 'bg-gray-500/40'}`} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-amber-200 font-semibold">Points de déplacement</span>
                            {isMyTurn && (
                                <button
                                    onClick={endMove}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow transition-colors"
                                >
                                    Terminer les déplacements
                                </button>
                            )}
                        </div>
                    )}

                    {/* Tourniquet */}
                    {state.phase === 'spin' && state.spin && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative w-20 h-20">
                                <img src={WHEEL_SPRITE} alt="Tourniquet" className="w-full h-full object-contain drop-shadow-lg" />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-amber-200 font-semibold">
                                {CREATURE_EMOJI[state.spin.animal]} {CREATURE_LABELS[state.spin.animal]}
                                {' · '}{state.spin.steps === 'teleport' ? 'T (réapparaît)' : `${state.spin.steps} case${state.spin.steps > 1 ? 's' : ''}`}
                            </span>
                            {isMyTurn && (
                                <button
                                    onClick={skipCreature}
                                    className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold shadow transition-colors"
                                >
                                    Passer
                                </button>
                            )}
                        </div>
                    )}

                    {/* État de l'île */}
                    <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-amber-200 font-semibold">
                        {(['beach', 'forest', 'mountain'] as const).map(level => (
                            <div key={level}>{LEVEL_LABELS[level]} : {tilesLeft(level)} tuile{tilesLeft(level) > 1 ? 's' : ''}</div>
                        ))}
                        {(() => {
                            const mine = state.players.find(p => p.userId === me.userId);
                            if (!mine || state.phase === 'finished') return null;
                            const dead = mine.meeples.filter(m => m.state === 'dead').length;
                            return (
                                <>
                                    <div className="mt-1 text-emerald-600 dark:text-emerald-300">
                                        Mes pions à l&apos;abri : {mine.saved}/12
                                    </div>
                                    {dead > 0 && (
                                        <div className="flex items-center gap-1 text-red-600 dark:text-red-300">
                                            <img src={TOKEN_DEAD_SPRITE} alt="Perdu" className="w-4 h-4 object-contain" />
                                            Mes pions perdus : {dead}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                <GameLogSidebar entries={state.log ?? []} />
            </main>

            {state.phase === 'finished' && winnerLabel && !modalDismissed && (
                <GameOverModal
                    elo={spectator ? null : myElo}
                    icon={
                        winnerLabel.isMe ? <TrophyIcon className="w-8 h-8 text-amber-500" />
                        : (typeof state.winner === 'number' && isBot(state.players[state.winner])) ? <CpuChipIcon className="w-8 h-8 text-indigo-400" />
                        : <XCircleIcon className="w-8 h-8 text-red-400" />
                    }
                    title={winnerLabel.title}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                    onClose={() => setModalDismissed(true)}
                    asModal
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={state.players
                            .map((p, idx) => {
                                const rank = state.ranking.indexOf(idx);
                                const surrendered = state.surrenderedIdxs.includes(idx);
                                const afk = state.afkIdxs.includes(idx);
                                return { p, idx, rank, surrendered, afk, abandoned: surrendered || afk };
                            })
                            .sort((a, b) => {
                                if (a.rank !== -1 && b.rank !== -1) return a.rank - b.rank;
                                if (a.rank !== -1) return -1;
                                if (b.rank !== -1) return 1;
                                return a.idx - b.idx;
                            })
                            .map(({ p, abandoned, surrendered, afk }) => {
                                const badges: string[] = [];
                                if (isBot(p)) badges.push('Bot');
                                if (surrendered) badges.push('Abandon');
                                else if (afk) badges.push('AFK');
                                return {
                                    userId: p.userId,
                                    username: p.username,
                                    score: `${p.saved}/12 pions sauvés`,
                                    badges,
                                    disqualified: abandoned,
                                };
                            })}
                    />
                </GameOverModal>
            )}
        </div>
    );
}
