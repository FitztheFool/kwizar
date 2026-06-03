// src/components/PlayerButton.tsx
import { UsersIcon } from '@heroicons/react/24/outline';

interface Player {
    username: string;
    score: number;
    placement: number | null;
}

interface PlayerButtonProps {
    players: Player[];
    onClick: () => void;
}

export default function PlayerButton({ players, onClick }: PlayerButtonProps) {
    if (players.length === 0) return <span className="text-gray-300 dark:text-gray-600">—</span>;

    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
            <UsersIcon className="w-3.5 h-3.5" /> {players.length}
        </button>
    );
}
