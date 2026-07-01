// src/components/SpectatorBadge.tsx
import { EyeIcon } from '@heroicons/react/24/outline';

/**
 * Petit badge « Spectateur » réutilisé par toutes les pages de jeu.
 * Affiché quand l'utilisateur observe une partie qu'il ne joue pas.
 */
export default function SpectatorBadge({ className = '' }: { className?: string }) {
    return (
        <span className={`text-xs bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${className}`}>
            <EyeIcon className="w-3.5 h-3.5" /> Spectateur
        </span>
    );
}
