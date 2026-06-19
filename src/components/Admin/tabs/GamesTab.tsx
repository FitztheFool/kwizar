'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CheckCircleIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

interface AdminGame {
    key: string;
    gameType: string;
    label: string;
    mode: 'solo' | 'both' | 'multi';
    enabled: boolean;
}

const MODE_LABEL: Record<AdminGame['mode'], string> = {
    solo: 'Solo',
    both: 'Mixte',
    multi: 'Multijoueur',
};

const MODE_ORDER: AdminGame['mode'][] = ['both', 'multi', 'solo'];

export default function GamesTab() {
    const [games, setGames] = useState<AdminGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const fetchGames = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/games', { cache: 'no-store' });
            if (res.ok) setGames((await res.json()).games ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    const toggle = useCallback(async (game: AdminGame) => {
        const next = !game.enabled;
        setSavingKey(game.key);
        // Optimiste : on bascule tout de suite, on annule si l'API échoue.
        setGames(prev => prev.map(g => g.key === game.key ? { ...g, enabled: next } : g));
        try {
            const res = await fetch('/api/admin/games', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: game.key, enabled: next }),
            });
            if (!res.ok) {
                setGames(prev => prev.map(g => g.key === game.key ? { ...g, enabled: game.enabled } : g));
                alert((await res.json())?.error ?? 'Erreur lors de la mise à jour');
            }
        } catch {
            setGames(prev => prev.map(g => g.key === game.key ? { ...g, enabled: game.enabled } : g));
            alert('Erreur réseau');
        } finally {
            setSavingKey(null);
        }
    }, []);

    const grouped = useMemo(() => MODE_ORDER.map(mode => ({
        mode,
        games: games.filter(g => g.mode === mode),
    })).filter(g => g.games.length > 0), [games]);

    const enabledCount = games.filter(g => g.enabled).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner fullScreen={false} message="Chargement des jeux..." />
            </div>
        );
    }

    return (
        <div id="admin-games" className="scroll-mt-24 space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{enabledCount}</span> jeu{enabledCount > 1 ? 'x' : ''} activé{enabledCount > 1 ? 's' : ''} sur {games.length}.
                Un jeu désactivé disparaît de l&apos;accueil et du lobby, et ne peut plus être lancé.
            </p>

            {grouped.map(({ mode, games: list }) => (
                <div key={mode}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                        {MODE_LABEL[mode]} <span className="text-gray-300 dark:text-gray-600">· {list.length}</span>
                    </h3>
                    <ul className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                        {list.map(game => (
                            <li key={game.key} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {game.enabled
                                        ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                                        : <NoSymbolIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />}
                                    <span className={`text-sm font-medium truncate ${game.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                                        {game.label}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={game.enabled}
                                    disabled={savingKey === game.key}
                                    onClick={() => toggle(game)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${game.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    title={game.enabled ? 'Désactiver' : 'Activer'}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${game.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
