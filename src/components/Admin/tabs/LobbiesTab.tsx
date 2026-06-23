'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, XMarkIcon, UsersIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameIcon from '@/components/GameIcon';
import { GAME_CONFIG } from '@/lib/gameConfig';

interface AdminLobby {
    id: string;
    title: string;
    gameType: string;
    status: 'waiting' | 'in-progress';
    isPublic: boolean;
    host: string;
    currentPlayers: number;
    maxPlayers: number;
    playerNames: string[];
}

// Le lobby-server stocke gameType en slug (cant-stop) ; GAME_CONFIG en clé (cant_stop).
const toKey = (gameType: string) => gameType.replace(/-/g, '_');
const labelOf = (gameType: string) => {
    const g = GAME_CONFIG[toKey(gameType) as keyof typeof GAME_CONFIG];
    return g?.label ?? gameType;
};

const REFRESH_MS = 5_000;

export default function LobbiesTab() {
    const [lobbies, setLobbies] = useState<AdminLobby[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [closing, setClosing] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    const fetchLobbies = useCallback(async (showSpinner = false) => {
        if (showSpinner) setLoading(true);
        try {
            const res = await fetch('/api/admin/lobbies', { cache: 'no-store' });
            if (!res.ok) {
                setError((await res.json().catch(() => null))?.error ?? 'Erreur de chargement');
                return;
            }
            const data = await res.json();
            setLobbies(data.lobbies ?? []);
            setError(null);
            setUpdatedAt(new Date());
        } catch {
            setError('Lobby-server injoignable');
        } finally {
            setLoading(false);
        }
    }, []);

    // Chargement initial + rafraîchissement périodique.
    useEffect(() => {
        fetchLobbies(true);
        const t = setInterval(() => fetchLobbies(false), REFRESH_MS);
        return () => clearInterval(t);
    }, [fetchLobbies]);

    const close = useCallback(async (lobby: AdminLobby) => {
        if (!confirm(`Forcer la fermeture du lobby « ${lobby.title} » (${lobby.currentPlayers} joueur·s) ?`)) return;
        setClosing(lobby.id);
        // Optimiste : on retire tout de suite de la liste.
        setLobbies(prev => prev.filter(l => l.id !== lobby.id));
        try {
            const res = await fetch('/api/admin/lobbies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId: lobby.id }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Erreur');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur réseau');
            fetchLobbies(false); // resynchronise en cas d'échec
        } finally {
            setClosing(null);
        }
    }, [fetchLobbies]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner fullScreen={false} message="Chargement des lobbies..." />
            </div>
        );
    }

    const totalPlayers = lobbies.reduce((n, l) => n + l.currentPlayers, 0);

    return (
        <div id="admin-lobbies" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{lobbies.length}</span> lobby{lobbies.length > 1 ? 's' : ''} actif{lobbies.length > 1 ? 's' : ''}
                    {' · '}<span className="font-semibold text-gray-700 dark:text-gray-200">{totalPlayers}</span> joueur{totalPlayers > 1 ? 's' : ''}
                    {updatedAt && <span className="text-gray-400 dark:text-gray-500"> · maj {updatedAt.toLocaleTimeString('fr-FR')}</span>}
                </p>
                <button
                    type="button"
                    onClick={() => fetchLobbies(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowPathIcon className="w-4 h-4" /> Rafraîchir
                </button>
            </div>

            {error && (
                <p className="px-4 py-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                    {error}
                </p>
            )}

            {!error && lobbies.length === 0 && (
                <p className="px-4 py-16 text-sm text-center text-gray-400 dark:text-gray-500">
                    Aucun lobby actif pour le moment.
                </p>
            )}

            {lobbies.length > 0 && (
                <ul className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                    {lobbies.map(lobby => (
                        <li key={lobby.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <GameIcon gameType={toKey(lobby.gameType)} className="w-9 h-9 rounded shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lobby.title}</span>
                                        {!lobby.isPublic && <LockClosedIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${lobby.status === 'in-progress'
                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
                                            {lobby.status === 'in-progress' ? 'En jeu' : 'Attente'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {labelOf(lobby.gameType)} · hôte {lobby.host} · {lobby.playerNames.join(', ') || '—'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    <UsersIcon className="w-4 h-4" /> {lobby.currentPlayers}/{lobby.maxPlayers}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => close(lobby)}
                                    disabled={closing === lobby.id}
                                    title="Forcer la fermeture"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" /> Fermer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
