'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useGameEnabledGuard } from '@/hooks/useGameEnabledGuard';
import GameUnavailable from '@/components/GameUnavailable';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useDames, isBot, type Coord, type Piece, type PlayerInfo } from '@/hooks/useDames';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import GamePageHeader from '@/components/GamePageHeader';
import SurrenderButton from '@/components/SurrenderButton';
import PlayerLabel from '@/components/shared/PlayerLabel';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, XCircleIcon, CpuChipIcon, ScaleIcon } from '@heroicons/react/24/outline';

const SIZE = 8;
const coordKey = ([r, c]: Coord) => `${r}-${c}`;

// Couleurs des pièces : joueur 0 = anthracite, joueur 1 = ivoire.
const PIECE_STYLE: Record<0 | 1, string> = {
    0: 'bg-gradient-to-br from-gray-700 to-gray-900 border-black/50',
    1: 'bg-gradient-to-br from-amber-50 to-amber-200 border-amber-300/70',
};
const LABEL_BG: Record<0 | 1, string> = { 0: 'bg-gray-800', 1: 'bg-amber-200' };

function PieceView({ piece, selectable, selected }: { piece: Piece; selectable: boolean; selected: boolean }) {
    return (
        <div
            className={`absolute inset-[14%] rounded-full border-2 shadow-md transition-all duration-150 flex items-center justify-center
                ${PIECE_STYLE[piece.p]}
                ${selected ? 'ring-4 ring-emerald-400' : selectable ? 'ring-2 ring-emerald-400/60' : ''}`}
        >
            {/* Anneau intérieur décoratif */}
            <div className={`absolute inset-[18%] rounded-full border ${piece.p === 0 ? 'border-white/15' : 'border-amber-700/25'}`} />
            {piece.k && (
                <span className={`relative text-[1.1rem] leading-none ${piece.p === 0 ? 'text-amber-300' : 'text-amber-700'}`}>♛</span>
            )}
        </div>
    );
}

function DamesPlayerLabel({ player, active, inactivityEndsAt }: { player: PlayerInfo; active: boolean; inactivityEndsAt?: number | null }) {
    return (
        <PlayerLabel
            username={player.username}
            active={active}
            isBot={isBot(player)}
            bgClass={LABEL_BG[player.colorIndex]}
            inactivityEndsAt={inactivityEndsAt}
        />
    );
}

export default function DamesPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound, modalDismissed, setModalDismissed } = useGamePage();
    const gameGuard = useGameEnabledGuard('dames');
    const myElo = useEloUpdate('dames', me.userId);

    const { players, gameState, myColorIndex, isMyTurn, vsBot, inactivityUserId, inactivityEndsAt, move, surrender } = useDames({
        lobbyId,
        userId: me.userId,
        username: me.username ?? '',
        onNotFound: () => setIsNotFound(true),
        onModalReset: () => setModalDismissed(false),
    });

    const [selected, setSelected] = useState<Coord | null>(null);

    // Cases jouables (départ) et destinations de la pièce sélectionnée.
    const movesByFrom = useMemo(() => {
        const map = new Map<string, Coord[]>();
        for (const m of gameState?.legalMoves ?? []) {
            const k = coordKey(m.from);
            const arr = map.get(k);
            if (arr) arr.push(m.to); else map.set(k, [m.to]);
        }
        return map;
    }, [gameState?.legalMoves]);

    // En pleine rafle, la pièce qui doit continuer est forcée.
    useEffect(() => {
        if (gameState?.mustContinueFrom) setSelected(gameState.mustContinueFrom);
    }, [gameState?.mustContinueFrom]);

    // Réinitialise la sélection quand ce n'est plus mon tour.
    useEffect(() => {
        if (!isMyTurn) setSelected(null);
    }, [isMyTurn]);

    if (gameGuard === 'disabled') return <GameUnavailable />;
    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!gameState || gameState.status === 'waiting') return (
        <GameWaitingScreen gameType="dames" gameName="Dames" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    const flip = myColorIndex === 1; // le joueur du haut voit le plateau retourné
    const winnerPlayer = gameState.winner !== null && gameState.winner !== 'draw'
        ? players.find(p => p.colorIndex === gameState.winner)
        : null;
    const player0 = players.find(p => p.colorIndex === 0);
    const player1 = players.find(p => p.colorIndex === 1);
    const showSurrender = gameState.status === 'playing';

    const selKey = selected ? coordKey(selected) : null;
    const destinations = selKey ? (movesByFrom.get(selKey) ?? []) : [];
    const destSet = new Set(destinations.map(coordKey));
    const lastMoveSet = new Set([gameState.lastMove?.from, gameState.lastMove?.to].filter(Boolean).map(c => coordKey(c as Coord)));

    const onSquareClick = (r: number, c: number) => {
        if (!isMyTurn) return;
        const key = coordKey([r, c]);
        // Clic sur une destination valide → on joue.
        if (selected && destSet.has(key)) { move(selected, [r, c]); setSelected(null); return; }
        // Clic sur une de mes pièces jouables → sélection (sauf rafle imposée).
        if (movesByFrom.has(key) && !gameState.mustContinueFrom) { setSelected([r, c]); return; }
        // Sinon, on désélectionne.
        if (!gameState.mustContinueFrom) setSelected(null);
    };

    return (
        <div className="flex-1 flex flex-col bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="dames" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Dames{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span></>}
                center={
                    <div className="flex items-center gap-2 text-sm">
                        {players.length === 2 && player0 && player1 ? (
                            <>
                                <DamesPlayerLabel player={player0} active={gameState.status === 'playing' && gameState.currentTurn === 0} inactivityEndsAt={inactivityUserId === player0.userId ? inactivityEndsAt : null} />
                                <span className="text-gray-400 dark:text-gray-600">vs</span>
                                <DamesPlayerLabel player={player1} active={gameState.status === 'playing' && gameState.currentTurn === 1} inactivityEndsAt={inactivityUserId === player1.userId ? inactivityEndsAt : null} />
                            </>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">En attente de joueurs…</span>
                        )}
                    </div>
                }
                right={showSurrender && <SurrenderButton onSurrender={surrender} />}
            />

            {gameState.status === 'playing' && (
                <TimerBar
                    endsAt={gameState.turnStartedAt ? gameState.turnStartedAt + gameState.turnDuration * 1000 : null}
                    duration={gameState.turnDuration}
                    label={
                        isMyTurn
                            ? (gameState.mustContinueFrom ? 'Rafle — continuez !' : 'Votre tour')
                            : vsBot && isBot(players.find(p => p.colorIndex === gameState.currentTurn))
                                ? 'Le bot réfléchit…'
                                : `Tour de ${players.find(p => p.colorIndex === gameState.currentTurn)?.username ?? '…'}`
                    }
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 p-4">
                <div className="hidden lg:block lg:w-72 shrink-0" aria-hidden />
                <div className="flex-1 flex flex-col items-center justify-center gap-6 min-w-0">
                    <div
                        className="grid rounded-xl overflow-hidden border-4 border-amber-900/80 shadow-2xl select-none"
                        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(34px, 8.5vw))`, maxWidth: '92vw' }}
                    >
                        {Array.from({ length: SIZE }, (_, dr) =>
                            Array.from({ length: SIZE }, (_, dc) => {
                                const r = flip ? SIZE - 1 - dr : dr;
                                const c = flip ? SIZE - 1 - dc : dc;
                                const dark = (r + c) % 2 === 1;
                                const cell = gameState.board[r][c];
                                const key = coordKey([r, c]);
                                const isSel = selKey === key;
                                const isDest = destSet.has(key);
                                const isLast = lastMoveSet.has(key);
                                const selectablePiece = isMyTurn && !gameState.mustContinueFrom && movesByFrom.has(key);
                                return (
                                    <div
                                        key={key}
                                        onClick={() => dark && onSquareClick(r, c)}
                                        className={`relative aspect-square
                                            ${dark ? 'bg-amber-800 dark:bg-amber-900' : 'bg-amber-100 dark:bg-amber-200/90'}
                                            ${isLast ? 'after:absolute after:inset-0 after:bg-emerald-400/20' : ''}
                                            ${dark && (selectablePiece || isDest || isSel) ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        {cell && <PieceView piece={cell} selectable={selectablePiece} selected={isSel} />}
                                        {isDest && (
                                            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full
                                                ${cell ? 'inset-1 ring-4 ring-emerald-400/80' : 'w-1/3 h-1/3 bg-emerald-400/70'}`} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <GameLogSidebar entries={gameState.log ?? []} />
            </main>

            {gameState.status === 'finished' && !modalDismissed && (
                <GameOverModal
                    elo={myElo}
                    icon={gameState.winner === 'draw' ? <ScaleIcon className="w-8 h-8 text-gray-400" /> : winnerPlayer?.userId === me.userId ? <TrophyIcon className="w-8 h-8 text-amber-500" /> : isBot(winnerPlayer) ? <CpuChipIcon className="w-8 h-8 text-indigo-400" /> : <XCircleIcon className="w-8 h-8 text-red-400" />}
                    title={
                        gameState.winner === 'draw'
                            ? 'Match nul !'
                            : winnerPlayer?.userId === me.userId
                                ? 'Vous avez gagné !'
                                : isBot(winnerPlayer)
                                    ? 'Le bot gagne !'
                                    : `${winnerPlayer?.username ?? 'Adversaire'} gagne !`
                    }
                    reason={gameState.reason ?? undefined}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                    onClose={() => setModalDismissed(true)}
                    asModal
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={[player0, player1].filter(Boolean).sort((a, b) =>
                            (gameState.scores[b!.colorIndex] ?? 0) - (gameState.scores[a!.colorIndex] ?? 0)
                        ).map((p) => {
                            const isWinner = p!.userId === winnerPlayer?.userId;
                            const isLoserBySurrender = !isWinner && gameState.reason === 'surrender';
                            const isLoserByAfk = !isWinner && gameState.reason === 'afk';
                            const bot = isBot(p);
                            return {
                                userId: p!.userId,
                                username: p!.username,
                                score: `${gameState.scores[p!.colorIndex] ?? 0} victoire${(gameState.scores[p!.colorIndex] ?? 0) !== 1 ? 's' : ''}`,
                                badges: [
                                    ...(bot ? ['Bot'] : []),
                                    ...(isLoserBySurrender ? ['Abandon'] : []),
                                    ...(isLoserByAfk ? ['AFK'] : []),
                                ],
                                disqualified: isLoserBySurrender || isLoserByAfk,
                            };
                        })}
                    />
                </GameOverModal>
            )}
        </div>
    );
}
