// src/components/Lobby/InviteFriendsPanel.tsx
// Waiting-room panel: any member can invite friends into the lobby. The invite is
// persisted + pushed in realtime by POST /api/lobby/invite, so the friend receives
// it even if they aren't connected at that exact moment.
'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';
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
                <div className="space-y-1.5">
                    {candidates.map(f => {
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
        </div>
    );
}
