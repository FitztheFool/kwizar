// src/components/LobbyCard.tsx
'use client';

import { UsersIcon, StarIcon, PlayIcon, CheckIcon } from '@heroicons/react/24/outline';
import GameIcon from '@/components/GameIcon';
import { useGameLabels } from '@/hooks/useGameLabels';

interface LobbyCardProps {
    lobby: {
        id: string;
        title: string;
        description: string;
        gameType: string;
        maxPlayers: number;
        currentPlayers: number;
        status: 'waiting' | 'in-progress';
        host: string;
        playerNames?: string[];
    };
    onJoin: (lobbyId: string) => void;
    onPlayersClick: (lobbyId: string, playerNames: string[]) => void;
}

export default function LobbyCard({ lobby, onJoin, onPlayersClick }: LobbyCardProps) {
    const { labelOf } = useGameLabels();
    const isFull = lobby.currentPlayers >= lobby.maxPlayers;
    const isWaiting = lobby.status === 'waiting';

    return (
        <div className="glass rounded-2xl p-6 hover:shadow-glow hover:-translate-y-0.5 transition-all relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{lobby.title}</h3>
                <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${isWaiting
                    ? 'bg-success/15 text-success'
                    : 'bg-info/15 text-info'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isWaiting ? 'bg-success' : 'bg-info'}`} />
                    {isWaiting ? 'En attente' : 'En cours'}
                </span>
            </div>


            <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-2">{lobby.description}</p>

            <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <GameIcon gameType={lobby.gameType} className="w-4 h-4" />
                        Jeu
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center gap-1.5">
                        <GameIcon gameType={lobby.gameType} className="w-3.5 h-3.5" />
                        {labelOf(lobby.gameType)}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4" />
                        Joueurs
                    </span>
                    <button
                        onClick={() => onPlayersClick(lobby.id, lobby.playerNames ?? [])}
                        className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        {lobby.currentPlayers}/{lobby.maxPlayers}
                    </button>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <StarIcon className="w-4 h-4" />
                        Hôte
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{lobby.host}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-accent-gradient h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(lobby.currentPlayers / lobby.maxPlayers) * 100}%` }}
                    />
                </div>
            </div>

            <button
                onClick={() => onJoin(lobby.id)}
                disabled={isFull && isWaiting}
                className="w-full bg-accent-gradient hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-glow"
            >
                {isFull && isWaiting
                    ? <><CheckIcon className="w-4 h-4" /> Complet</>
                    : <><PlayIcon className="w-4 h-4" /> Rejoindre</>
                }
            </button>
        </div>
    );
}
