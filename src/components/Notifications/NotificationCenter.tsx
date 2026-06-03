// src/components/Notifications/NotificationCenter.tsx
// Single bell that groups every actionable notification: friend requests,
// game (lobby) invites and unread messages. Keeps toasts to a minimum — the
// full list lives here.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BellIcon,
    CheckIcon,
    XMarkIcon,
    UserPlusIcon,
    PlayIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';
import { useFriends } from '@/context/FriendsContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useMessages } from '@/context/MessagesContext';
import { GAME_LABEL_MAP } from '@/lib/gameConfig';

type IncomingRequest = {
    friendshipId: string;
    user: { id: string; username: string | null; image: string | null; online: boolean };
};

export default function NotificationCenter() {
    const router = useRouter();
    const { pendingCount, refresh: refreshFriends } = useFriends();
    const { invites, dismissInvite } = useNotifications();
    const { conversations, openThread } = useMessages();

    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState<IncomingRequest[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const unreadConversations = conversations.filter(c => c.unreadCount > 0);
    const total = pendingCount + invites.length + unreadConversations.length;

    const loadRequests = useCallback(async () => {
        try {
            const res = await fetch('/api/friends/requests');
            if (!res.ok) return;
            const data = await res.json();
            setRequests(Array.isArray(data.incoming) ? data.incoming : []);
        } catch {
            /* ignore */
        }
    }, []);

    // Refresh the request list whenever the panel opens (badge count comes from context).
    useEffect(() => {
        if (open) loadRequests();
    }, [open, loadRequests]);

    // Close on outside click / Escape.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const acceptRequest = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/friends/${id}/accept`, { method: 'POST' });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.friendshipId !== id));
                refreshFriends();
            }
        } finally {
            setBusy(null);
        }
    };

    const declineRequest = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/friends/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.friendshipId !== id));
                refreshFriends();
            }
        } finally {
            setBusy(null);
        }
    };

    const joinInvite = (inv: { id: string; lobbyId: string }) => {
        dismissInvite(inv.id);
        setOpen(false);
        router.push(`/lobby/create/${inv.lobbyId}`);
    };

    const openConversation = (userId: string) => {
        setOpen(false);
        openThread(userId);
    };

    const isEmpty = requests.length === 0 && invites.length === 0 && unreadConversations.length === 0;

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Notifications"
                className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-400 transition-all"
            >
                <BellIcon className="w-5 h-5" />
                {total > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {total > 9 ? '9+' : total}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl z-[70]">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
                        <span className="font-bold text-gray-900 dark:text-white">Notifications</span>
                        {total > 0 && <span className="text-xs text-gray-400">{total}</span>}
                    </div>

                    {isEmpty ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">Aucune notification.</p>
                    ) : (
                        <div className="py-1">
                            {/* Demandes d'ami */}
                            {requests.length > 0 && (
                                <Section label="Demandes d'ami">
                                    {requests.map(r => {
                                        const name = r.user.username ?? 'Joueur';
                                        return (
                                            <div key={r.friendshipId} className="flex items-center gap-2 px-3 py-2">
                                                <UserAvatar name={name} image={r.user.image} shape="round" size="sm" />
                                                <span className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                    <UserPlusIcon className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                                    {name}
                                                </span>
                                                <button
                                                    onClick={() => acceptRequest(r.friendshipId)}
                                                    disabled={busy === r.friendshipId}
                                                    aria-label="Accepter"
                                                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => declineRequest(r.friendshipId)}
                                                    disabled={busy === r.friendshipId}
                                                    aria-label="Refuser"
                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </Section>
                            )}

                            {/* Invitations à jouer */}
                            {invites.length > 0 && (
                                <Section label="Invitations à jouer">
                                    {invites.map(inv => {
                                        const game = GAME_LABEL_MAP[inv.gameType] ?? 'une partie';
                                        return (
                                            <div key={inv.id} className="flex items-center gap-2 px-3 py-2">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                                                    <PlayIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-white">
                                                    <span className="font-bold">{inv.fromUsername ?? 'Un ami'}</span> · {game}
                                                </span>
                                                <button
                                                    onClick={() => joinInvite(inv)}
                                                    className="px-2.5 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
                                                >
                                                    Rejoindre
                                                </button>
                                                <button
                                                    onClick={() => dismissInvite(inv.id)}
                                                    aria-label="Ignorer"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </Section>
                            )}

                            {/* Messages */}
                            {unreadConversations.length > 0 && (
                                <Section label="Messages">
                                    {unreadConversations.map(c => {
                                        const name = c.user.username ?? 'Joueur';
                                        return (
                                            <button
                                                key={c.user.id}
                                                onClick={() => openConversation(c.user.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                            >
                                                <UserAvatar name={name} image={c.user.image} online={c.user.online} shape="round" size="sm" />
                                                <span className="flex-1 min-w-0">
                                                    <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</span>
                                                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        <ChatBubbleLeftRightIcon className="w-3 h-3 inline mr-1" />
                                                        {c.lastMessage.body}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                                                    {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </Section>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="py-1">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            {children}
        </div>
    );
}
