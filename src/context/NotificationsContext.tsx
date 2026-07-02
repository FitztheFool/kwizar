// src/context/NotificationsContext.tsx
// Lobby invites are persisted server-side (LobbyInvite). We load pending ones on
// login (so an invite isn't lost if the user wasn't connected) — those live in the
// notification center (bell). New invites arriving in realtime also pop as a small,
// capped, self-dismissing toast stack. Dismissing/joining deletes the invite.
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getLobbySocket } from '@/lib/socket';
import { useMeSummary } from '@/hooks/useMeSummary';

export type InviteToast = {
    id: string; // LobbyInvite DB id
    lobbyId: string;
    gameType: string;
    fromUserId: string;
    fromUsername: string | null;
};

type NotificationsContextType = {
    /** All pending invites — shown in the notification center. */
    invites: InviteToast[];
    /** Transient realtime arrivals — shown as toasts (capped). */
    toasts: InviteToast[];
    /** Remove everywhere + delete server-side (join / explicit dismiss). */
    dismissInvite: (id: string) => void;
    /** Hide a toast only; it stays in the notification center. */
    dismissToast: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const MAX_TOASTS = 2;
const TOAST_TTL_MS = 12_000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const socket = useMemo(() => getLobbySocket(), []);
    const { data: summary, mutate } = useMeSummary();
    const [invites, setInvites] = useState<InviteToast[]>([]);
    const [toasts, setToasts] = useState<InviteToast[]>([]);

    // Backlog des invitations : issu du résumé partagé (/api/me/summary). La liste
    // serveur fait foi ; les arrivées temps réel (socket) s'ajoutent en local d'ici
    // le prochain rafraîchissement.
    useEffect(() => {
        if (!userId) { setInvites([]); setToasts([]); return; }
        if (summary?.invites) setInvites(summary.invites);
    }, [userId, summary?.invites]);

    // Realtime arrivals → bell + a capped toast.
    useEffect(() => {
        if (!socket || !userId) return;
        const onInvited = (data: InviteToast) => {
            if (!data?.lobbyId || !data?.id) return;
            setInvites(prev => [...prev.filter(i => i.lobbyId !== data.lobbyId), data]);
            setToasts(prev => [...prev.filter(i => i.lobbyId !== data.lobbyId), data].slice(-MAX_TOASTS));
        };
        socket.on('lobby:invited', onInvited);
        return () => {
            socket.off('lobby:invited', onInvited);
        };
    }, [socket, userId]);

    // Auto-dismiss toasts after a short delay (they remain in the bell).
    useEffect(() => {
        if (toasts.length === 0) return;
        const timers = toasts.map(t =>
            setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), TOAST_TTL_MS),
        );
        return () => timers.forEach(clearTimeout);
    }, [toasts]);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(i => i.id !== id));
    }, []);

    const dismissInvite = useCallback((id: string) => {
        setInvites(prev => prev.filter(i => i.id !== id));
        setToasts(prev => prev.filter(i => i.id !== id));
        // Supprime côté serveur puis resynchronise le résumé partagé.
        fetch(`/api/lobby/invites/${id}`, { method: 'DELETE' }).then(() => mutate()).catch(() => {});
    }, [mutate]);

    return (
        <NotificationsContext.Provider value={{ invites, toasts, dismissInvite, dismissToast }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
    return ctx;
}
