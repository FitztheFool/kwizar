// src/components/GameOverModal.tsx
'use client';

import React, { useState } from 'react';
import { TrophyIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import EloDeltaList from '@/components/shared/EloDeltaList';

interface GameOverModalProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    onLobby: () => void;
    onLeave: () => void;
    onClose?: () => void;
    lobbyLabel?: string;
    asModal?: boolean;
    /**
     * Autorise la fermeture (×, clic-extérieur, Échap). **Faux par défaut** : une modal
     * de fin de partie fermée laisse un plateau vide qu'on ne peut plus rouvrir. Aucun
     * jeu ne demandait `true` ; à passer explicitement si un écran a une raison de l'être.
     */
    dismissable?: boolean;
    /** Raison de fin (forfait) — affichée de façon uniforme, prioritaire sur `subtitle`. */
    reason?: 'afk' | 'surrender' | 'disconnect' | null;
    elo?: { userId: string; username?: string | null; after: number; delta: number }[] | null;
    /** Mode spectateur : force l'icône œil + titre « Vous avez observé cette partie », masque l'ELO. */
    spectator?: boolean;
}

/** Libellés canoniques des fins de partie — identiques pour tous les jeux. */
export const REASON_LABEL: Record<'afk' | 'surrender' | 'disconnect', string> = {
    surrender: 'Abandon',
    afk: 'AFK',
    disconnect: 'Déconnexion',
};

export default function GameOverModal({
    icon,
    title,
    subtitle,
    children,
    onLobby,
    onLeave,
    onClose,
    lobbyLabel,
    asModal = false,
    dismissable = false,
    reason,
    elo,
    spectator = false,
}: GameOverModalProps) {
    const displaySubtitle = reason ? REASON_LABEL[reason] : subtitle;
    const displayTitle = spectator ? 'Vous avez observé cette partie' : title;
    const displayIcon = spectator
        ? <EyeIcon className="w-8 h-8 text-purple-400" />
        : (icon ?? <TrophyIcon className="w-8 h-8 text-amber-500" />);
    const displayElo = spectator ? null : elo;
    // Toujours fermable quand affiché en modal (état interne), même si la page ne passe pas onClose.
    const [dismissed, setDismissed] = useState(false);
    const close = () => { setDismissed(true); onClose?.(); };
    const closable = asModal && dismissable;
    // ⚠️ tous les hooks AVANT tout return conditionnel (règles des hooks).
    const trapRef = useFocusTrap<HTMLDivElement>(asModal && dismissable && !dismissed, close);

    if (asModal && dismissed) return null;
    const card = (
        <div
            ref={asModal ? trapRef : undefined}
            role={asModal ? 'dialog' : undefined}
            aria-modal={asModal ? true : undefined}
            aria-label={displayTitle}
            className="relative glass-strong rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-4 animate-scale-in"
        >
            {closable && (
                <button
                    onClick={close}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
                    aria-label="Fermer"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            )}
            <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {displayIcon}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayTitle}</h2>
                {displaySubtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{displaySubtitle}</p>}
                <EloDeltaList elo={displayElo} />
            </div>
            {children && <div className="text-left w-full">{children}</div>}
            <div className="flex gap-3 pt-2">
                <button
                    onClick={onLobby}
                    className="flex-1 py-3 rounded-xl bg-accent-gradient hover:brightness-110 text-white font-bold text-sm transition-all"
                >
                    {lobbyLabel ?? 'Retour au lobby'}
                </button>
                <button
                    onClick={onLeave}
                    className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
                >
                    Quitter
                </button>
            </div>
        </div>
    );

    if (asModal) {
        return (
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4"
                onClick={(e) => { if (closable && e.target === e.currentTarget) close(); }}
            >
                {card}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {card}
        </div>
    );
}
