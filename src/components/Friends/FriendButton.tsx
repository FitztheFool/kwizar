'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckIcon, UserPlusIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useFriends } from '@/context/FriendsContext';
import { useMessages } from '@/context/MessagesContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { Relationship } from '@/lib/friends';

type Rel = Relationship | 'loading';

/**
 * Friend action button shown on another user's profile. Reflects the current
 * relationship and lets the viewer add / cancel / accept / remove.
 */
export default function FriendButton({
    username,
    isOwnProfile = false,
    className = '',
}: {
    username: string;
    isOwnProfile?: boolean;
    className?: string;
}) {
    const { data: session } = useSession();
    const { refresh } = useFriends();
    const { openThread } = useMessages();
    const { friends: friendsEnabled, messages: messagesEnabled } = useFeatureFlags();
    const [rel, setRel] = useState<Rel>('loading');
    const [friendshipId, setFriendshipId] = useState<string | null>(null);
    const [targetId, setTargetId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const isGuest = (session?.user?.isAnonymous ?? false) || session?.user?.role === 'GUEST';
    const hidden = isOwnProfile || !session?.user?.id || isGuest;

    useEffect(() => {
        if (hidden) return;
        let active = true;
        fetch(`/api/friends/status?username=${encodeURIComponent(username)}`)
            .then(r => (r.ok ? r.json() : null))
            .then(d => {
                if (active && d) {
                    setRel(d.relationship);
                    setFriendshipId(d.friendshipId);
                    setTargetId(d.userId ?? null);
                }
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [username, hidden]);

    if (hidden || rel === 'loading') return null;

    const send = async () => {
        setBusy(true);
        try {
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                setRel(d.status === 'friends' ? 'friends' : 'pending_out');
                setFriendshipId(d.friendshipId);
                refresh();
            }
        } finally {
            setBusy(false);
        }
    };

    const accept = async () => {
        if (!friendshipId) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/friends/${friendshipId}/accept`, { method: 'POST' });
            if (res.ok) {
                setRel('friends');
                refresh();
            }
        } finally {
            setBusy(false);
        }
    };

    const cancelOrRemove = async () => {
        if (!friendshipId) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
            if (res.ok) {
                setRel('none');
                setFriendshipId(null);
                refresh();
            }
        } finally {
            setBusy(false);
        }
    };

    const base =
        'text-xs font-semibold rounded-lg px-3 py-1.5 transition shrink-0 flex items-center gap-1 disabled:opacity-50 ' +
        className;

    // Social entièrement désactivé pour ce viewer → aucun bouton.
    if (!friendsEnabled && !messagesEnabled) return null;

    // Amis désactivés : on ne montre les actions d'amitié que si on est déjà amis
    // (et seulement le bouton Message, si la messagerie est active).
    if (!friendsEnabled && rel !== 'friends') return null;

    if (rel === 'none') {
        return (
            <button onClick={send} disabled={busy} className={base + ' bg-primary-600 hover:bg-primary-700 text-white'}>
                <UserPlusIcon className="w-3.5 h-3.5" />
                Ajouter en ami
            </button>
        );
    }
    if (rel === 'pending_out') {
        return (
            <button
                onClick={cancelOrRemove}
                disabled={busy}
                title="Annuler la demande"
                className={base + ' border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
            >
                <ClockIcon className="w-3.5 h-3.5" />
                Demande envoyée
            </button>
        );
    }
    if (rel === 'pending_in') {
        return (
            <button onClick={accept} disabled={busy} className={base + ' bg-emerald-500 hover:bg-emerald-600 text-white'}>
                <CheckIcon className="w-3.5 h-3.5" />
                Accepter la demande
            </button>
        );
    }
    // friends
    return (
        <div className="flex items-center gap-2">
            {targetId && messagesEnabled && (
                <button
                    onClick={() => openThread(targetId)}
                    title="Envoyer un message"
                    className={base + ' bg-primary-600 hover:bg-primary-700 text-white'}
                >
                    <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                    Message
                </button>
            )}
            {friendsEnabled && (
                <button
                    onClick={cancelOrRemove}
                    disabled={busy}
                    title="Retirer cet ami"
                    className={base + ' border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20'}
                >
                    <CheckIcon className="w-3.5 h-3.5" />
                    Amis
                </button>
            )}
        </div>
    );
}
