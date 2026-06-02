'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CheckIcon,
    XMarkIcon,
    UserPlusIcon,
    UsersIcon,
    ClockIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useFriends } from '@/context/FriendsContext';
import { useMessages } from '@/context/MessagesContext';

type FriendUser = { id: string; username: string | null; image: string | null; online: boolean };
type Friend = FriendUser & { friendshipId: string };
type RequestItem = { friendshipId: string; user: FriendUser };
type Tab = 'friends' | 'requests' | 'add';
type Rel = 'none' | 'pending_out' | 'pending_in' | 'friends';
type SearchResult = {
    id: string;
    username: string | null;
    image: string | null;
    relationship: Rel;
    friendshipId: string | null;
};

function PersonRow({
    user,
    children,
}: {
    user: FriendUser;
    children?: React.ReactNode;
}) {
    const name = user.username ?? 'Joueur';
    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <UserAvatar name={name} image={user.image} online={user.online} shape="round" size="md" />
            <div className="min-w-0 flex-1">
                <Link
                    href={`/user/${user.username ?? ''}`}
                    className="font-semibold text-gray-900 dark:text-white truncate block hover:text-primary-600 dark:hover:text-primary-400"
                >
                    {name}
                </Link>
                <span className={`text-xs ${user.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                    {user.online ? 'En ligne' : 'Hors ligne'}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">{children}</div>
        </div>
    );
}

export default function FriendsPage() {
    const { refresh: refreshBadge } = useFriends();
    const { openThread } = useMessages();
    const [tab, setTab] = useState<Tab>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incoming, setIncoming] = useState<RequestItem[]>([]);
    const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const [addInput, setAddInput] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [addMsg, setAddMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const loadAll = useCallback(async () => {
        try {
            const [fr, rq] = await Promise.all([
                fetch('/api/friends').then(r => r.json()),
                fetch('/api/friends/requests').then(r => r.json()),
            ]);
            setFriends(fr.friends ?? []);
            setIncoming(rq.incoming ?? []);
            setOutgoing(rq.outgoing ?? []);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const accept = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/friends/${id}/accept`, { method: 'POST' });
            if (res.ok) {
                await loadAll();
                refreshBadge();
            }
        } finally {
            setBusy(null);
        }
    };

    const removeFriendship = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/friends/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadAll();
                refreshBadge();
            }
        } finally {
            setBusy(null);
        }
    };

    // Debounced typeahead search for the "Ajouter" tab.
    useEffect(() => {
        const q = addInput.trim();
        setAddMsg(null);
        if (!q) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                setResults(data.results ?? []);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [addInput]);

    const patchResult = (id: string, rel: Rel, friendshipId: string | null) =>
        setResults(prev => prev.map(x => (x.id === id ? { ...x, relationship: rel, friendshipId } : x)));

    const addFromResult = async (r: SearchResult) => {
        setBusy(r.id);
        setAddMsg(null);
        try {
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: r.username }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                patchResult(r.id, data.status === 'friends' ? 'friends' : 'pending_out', data.friendshipId ?? null);
                refreshBadge();
                loadAll();
            } else {
                setAddMsg({ type: 'err', text: data.error ?? 'Une erreur est survenue.' });
            }
        } finally {
            setBusy(null);
        }
    };

    const acceptFromResult = async (r: SearchResult) => {
        if (!r.friendshipId) return;
        setBusy(r.id);
        try {
            const res = await fetch(`/api/friends/${r.friendshipId}/accept`, { method: 'POST' });
            if (res.ok) {
                patchResult(r.id, 'friends', r.friendshipId);
                refreshBadge();
                loadAll();
            }
        } finally {
            setBusy(null);
        }
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'friends', label: 'Amis', icon: <UsersIcon className="w-4 h-4" />, count: friends.length },
        { id: 'requests', label: 'Demandes', icon: <ClockIcon className="w-4 h-4" />, count: incoming.length },
        { id: 'add', label: 'Ajouter', icon: <UserPlusIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                Amis
            </h1>

            {/* Tabs */}
            <div className="flex gap-1 p-1 mb-5 rounded-xl bg-gray-100 dark:bg-gray-800">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ' +
                            (tab === t.id
                                ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')
                        }
                    >
                        {t.icon}
                        {t.label}
                        {typeof t.count === 'number' && t.count > 0 && (
                            <span className="ml-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <LoadingSpinner fullScreen={false} message="Chargement..." />
            ) : (
                <>
                    {/* --- Amis --- */}
                    {tab === 'friends' && (
                        <div className="space-y-2">
                            {friends.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">
                                    Pas encore d&apos;amis. Va dans l&apos;onglet « Ajouter » !
                                </p>
                            ) : (
                                friends.map(f => (
                                    <PersonRow key={f.friendshipId} user={f}>
                                        <button
                                            onClick={() => openThread(f.id)}
                                            aria-label="Envoyer un message"
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => removeFriendship(f.friendshipId)}
                                            disabled={busy === f.friendshipId}
                                            aria-label="Retirer cet ami"
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </PersonRow>
                                ))
                            )}
                        </div>
                    )}

                    {/* --- Demandes --- */}
                    {tab === 'requests' && (
                        <div className="space-y-5">
                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Reçues
                                </h2>
                                {incoming.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-3">Aucune demande reçue.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {incoming.map(r => (
                                            <PersonRow key={r.friendshipId} user={r.user}>
                                                <button
                                                    onClick={() => accept(r.friendshipId)}
                                                    disabled={busy === r.friendshipId}
                                                    aria-label="Accepter"
                                                    className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                                                >
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => removeFriendship(r.friendshipId)}
                                                    disabled={busy === r.friendshipId}
                                                    aria-label="Refuser"
                                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </PersonRow>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Envoyées
                                </h2>
                                {outgoing.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-3">Aucune demande en attente.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {outgoing.map(r => (
                                            <PersonRow key={r.friendshipId} user={r.user}>
                                                <span className="text-xs text-gray-400 mr-1">En attente</span>
                                                <button
                                                    onClick={() => removeFriendship(r.friendshipId)}
                                                    disabled={busy === r.friendshipId}
                                                    aria-label="Annuler la demande"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </PersonRow>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* --- Ajouter --- */}
                    {tab === 'add' && (
                        <div>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={addInput}
                                    onChange={e => setAddInput(e.target.value)}
                                    placeholder="Rechercher un joueur par pseudo"
                                    autoFocus
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>

                            {addMsg && (
                                <p className={'mt-3 text-sm ' + (addMsg.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                                    {addMsg.text}
                                </p>
                            )}

                            <div className="mt-3 space-y-2">
                                {searching && <p className="text-sm text-gray-400 py-2">Recherche…</p>}
                                {!searching && addInput.trim() && results.length === 0 && (
                                    <p className="text-sm text-gray-400 py-2">Aucun joueur trouvé.</p>
                                )}
                                {results.map(r => {
                                    const name = r.username ?? 'Joueur';
                                    return (
                                        <div
                                            key={r.id}
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                        >
                                            <UserAvatar name={name} image={r.image} shape="round" size="sm" />
                                            <Link
                                                href={`/user/${r.username ?? ''}`}
                                                className="font-semibold text-gray-900 dark:text-white truncate flex-1 hover:text-primary-600 dark:hover:text-primary-400"
                                            >
                                                {name}
                                            </Link>
                                            {r.relationship === 'none' && (
                                                <button
                                                    onClick={() => addFromResult(r)}
                                                    disabled={busy === r.id}
                                                    className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                                                >
                                                    <UserPlusIcon className="w-4 h-4" />
                                                    Ajouter
                                                </button>
                                            )}
                                            {r.relationship === 'pending_out' && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                                    <ClockIcon className="w-4 h-4" />
                                                    En attente
                                                </span>
                                            )}
                                            {r.relationship === 'pending_in' && (
                                                <button
                                                    onClick={() => acceptFromResult(r)}
                                                    disabled={busy === r.id}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                    Accepter
                                                </button>
                                            )}
                                            {r.relationship === 'friends' && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                                                    <CheckIcon className="w-4 h-4" />
                                                    Ami
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
