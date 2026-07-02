// src/components/Lobby/InviteFriendsPanel.tsx
// Waiting-room panel: any member can invite friends into the lobby. The invite is
// persisted + pushed in realtime by POST /api/lobby/invite, so the friend receives
// it even if they aren't connected at that exact moment.
'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, UserPlusIcon, UsersIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';

type Friend = { id: string; username: string | null; image: string | null; online: boolean };

export default function InviteFriendsPanel({
    memberIds,
    lobbyId,
    gameType,
}: {
    memberIds: string[];
    lobbyId: string;
    gameType: string;
}) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [invited, setInvited] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 5;

    useEffect(() => {
        let active = true;
        fetch('/api/friends')
            .then(r => (r.ok ? r.json() : { friends: [] }))
            .then(d => {
                if (active) {
                    setFriends(d.friends ?? []);
                    setLoaded(true);
                }
            })
            .catch(() => active && setLoaded(true));
        return () => {
            active = false;
        };
    }, []);

    if (!loaded) return null;

    const memberSet = new Set(memberIds);
    const candidates = friends.filter(f => !memberSet.has(f.id));

    const q = query.trim().toLowerCase();
    const filtered = q ? candidates.filter(f => (f.username ?? 'Joueur').toLowerCase().includes(q)) : candidates;
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount - 1);
    const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    const invite = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch('/api/lobby/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId: id, lobbyId, gameType }),
            });
            if (res.ok) setInvited(prev => new Set(prev).add(id));
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="glass rounded-2xl p-5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                <UsersIcon className="w-3.5 h-3.5" />
                Inviter des amis
            </label>
            {candidates.length === 0 ? (
                <p className="text-xs text-gray-400">Aucun ami à inviter pour le moment.</p>
            ) : (
                <>
                    {candidates.length > PAGE_SIZE && (
                        <div className="relative mb-2.5">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                value={query}
                                onChange={e => { setQuery(e.target.value); setPage(0); }}
                                placeholder="Rechercher un ami…"
                                className="w-full text-sm rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-8 pr-2.5 py-1.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                            />
                        </div>
                    )}
                    {filtered.length === 0 ? (
                        <p className="text-xs text-gray-400">Aucun ami trouvé.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {pageItems.map(f => {
                                const name = f.username ?? 'Joueur';
                                const done = invited.has(f.id);
                                return (
                                    <div key={f.id} className="flex items-center gap-2">
                                        <UserAvatar name={name} image={f.image} online={f.online} shape="round" size="sm" />
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate flex-1">{name}</span>
                                        <button
                                            onClick={() => invite(f.id)}
                                            disabled={done || busy === f.id}
                                            className={
                                                'shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-60 ' +
                                                (done
                                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                                    : 'text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/20')
                                            }
                                        >
                                            {done ? <><CheckIcon className="w-3.5 h-3.5" />Invité</> : <><UserPlusIcon className="w-3.5 h-3.5" />Inviter</>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {pageCount > 1 && (
                        <div className="flex items-center justify-between mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={safePage === 0}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Page précédente"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <span>{safePage + 1} / {pageCount}</span>
                            <button
                                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                                disabled={safePage >= pageCount - 1}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Page suivante"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
