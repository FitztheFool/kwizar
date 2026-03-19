// src/components/GameOverModal.tsx
'use client';

import React from 'react';

interface GameOverModalProps {
    emoji?: string;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    onLobby: () => void;
    onLeave: () => void;
    /** true = fixed overlay on top of the board; false (default) = full page */
    asModal?: boolean;
}

export default function GameOverModal({
    emoji = '🏆',
    title,
    subtitle,
    children,
    onLobby,
    onLeave,
    asModal = false,
}: GameOverModalProps) {
    const card = (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl space-y-4">
            <div className="text-6xl">{emoji}</div>
            <div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                {subtitle && <p className="text-slate-400 text-sm mt-2">{subtitle}</p>}
            </div>
            {children && <div className="text-left w-full">{children}</div>}
            <div className="flex gap-3 pt-2">
                <button
                    onClick={onLobby}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
                >
                    Retour au lobby
                </button>
                <button
                    onClick={onLeave}
                    className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 text-sm font-semibold hover:border-slate-500 hover:text-slate-200 transition-all"
                >
                    Quitter
                </button>
            </div>
        </div>
    );

    if (asModal) {
        return (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50">
                {card}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            {card}
        </div>
    );
}
