'use client';

import { useCallback, useEffect, useState } from 'react';
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
    const [error, setError] = useState<string | null>(null);

    const isGuest = (session?.user?.isAnonymous ?? false) || session?.user?.role === 'GUEST';
    const hidden = isOwnProfile || !session?.user?.id || isGuest;

    /** Recharge la relation depuis le serveur — source de vérité en cas d'état local périmé. */
    const syncStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/friends/status?username=${encodeURIComponent(username)}`);
            if (!res.ok) return;
            const d = await res.json();
            setRel(d.relationship);
            setFriendshipId(d.friendshipId);
            setTargetId(d.userId ?? null);
        } catch {
            /* silencieux : le bouton garde son dernier état connu */
        }
    }, [username]);

    useEffect(() => {
        if (hidden) return;
        void syncStatus();
    }, [hidden, syncStatus]);

    if (hidden || rel === 'loading') return null;

    /** Message d'erreur renvoyé par l'API, ou un repli si la réponse n'en porte pas. */
    const readError = async (res: Response) => {
        const d = await res.json().catch(() => ({}));
        return typeof d?.error === 'string' ? d.error : 'Une erreur est survenue.';
    };

    const send = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            if (!res.ok) {
                // 409 « déjà amis » / « demande déjà envoyée » : l'état local est périmé
                // (l'autre a agi depuis le chargement) → resynchronise au lieu de rester bloqué.
                setError(await readError(res));
                if (res.status === 409) await syncStatus();
                return;
            }
            const d = await res.json().catch(() => ({}));
            setRel(d.status === 'friends' ? 'friends' : 'pending_out');
            setFriendshipId(d.friendshipId);
            refresh();
        } catch {
            setError('Connexion impossible.');
        } finally {
            setBusy(false);
        }
    };

    const accept = async () => {
        if (!friendshipId) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/friends/${friendshipId}/accept`, { method: 'POST' });
            if (!res.ok) {
                setError(await readError(res));
                return;
            }
            setRel('friends');
            refresh();
        } catch {
            setError('Connexion impossible.');
        } finally {
            setBusy(false);
        }
    };

    const cancelOrRemove = async () => {
        if (!friendshipId) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
            if (!res.ok) {
                setError(await readError(res));
                return;
            }
            setRel('none');
            setFriendshipId(null);
            refresh();
        } catch {
            setError('Connexion impossible.');
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

    const action =
        rel === 'none' ? (
            <button onClick={send} disabled={busy} className={base + ' bg-primary-600 hover:bg-primary-700 text-white'}>
                <UserPlusIcon className="w-3.5 h-3.5" />
                Ajouter en ami
            </button>
        ) : rel === 'pending_out' ? (
            <button
                onClick={cancelOrRemove}
                disabled={busy}
                title="Annuler la demande"
                className={base + ' border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
            >
                <ClockIcon className="w-3.5 h-3.5" />
                Demande envoyée
            </button>
        ) : rel === 'pending_in' ? (
            <button onClick={accept} disabled={busy} className={base + ' bg-emerald-500 hover:bg-emerald-600 text-white'}>
                <CheckIcon className="w-3.5 h-3.5" />
                Accepter la demande
            </button>
        ) : (
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

    // Sans ce retour d'erreur, un refus de l'API (déjà amis, quota, fonctionnalité
    // coupée) laissait le bouton parfaitement muet — le clic semblait sans effet.
    if (!error) return action;
    return (
        <div className="flex flex-col items-start gap-1">
            {action}
            <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400">
                {error}
            </p>
        </div>
    );
}
