// src/context/MessagesContext.tsx
// Global private-message state: conversation list, unread badge, the floating dock,
// and realtime delivery over the always-on lobby socket. Mirrors FriendsContext.
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getLobbySocket } from '@/lib/socket';

export type DMMessage = {
    id: string;
    senderId: string;
    recipientId: string;
    body: string;
    createdAt: string;
    readAt: string | null;
    pending?: boolean;
    failed?: boolean;
};

export type Conversation = {
    user: { id: string; username: string | null; image: string | null; online: boolean };
    lastMessage: { body: string; createdAt: string; fromMe: boolean };
    unreadCount: number;
};

type ThreadState = {
    partner: { id: string; username: string | null; image: string | null } | null;
    messages: DMMessage[];
    loading: boolean;
};

type MessagesContextType = {
    conversations: Conversation[];
    totalUnread: number;
    dockOpen: boolean;
    activeUserId: string | null;
    threads: Record<string, ThreadState>;
    refreshConversations: () => void;
    loadThread: (userId: string) => void;
    openThread: (userId: string) => void;
    closeThread: () => void;
    openDock: () => void;
    closeDock: () => void;
    sendMessage: (userId: string, body: string) => Promise<void>;
};

const MessagesContext = createContext<MessagesContextType | null>(null);

/** Merge one message into a thread list, deduping by id and reconciling optimistic temps. */
function mergeMessage(list: DMMessage[], msg: DMMessage): DMMessage[] {
    if (list.some(m => m.id === msg.id)) return list;
    const tempIdx = list.findIndex(
        m => m.id.startsWith('temp-') && m.senderId === msg.senderId && m.body === msg.body,
    );
    if (tempIdx !== -1) {
        const next = list.slice();
        next[tempIdx] = msg;
        return next;
    }
    return [...list, msg];
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const socket = useMemo(() => getLobbySocket(), []);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [dockOpen, setDockOpen] = useState(false);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [threads, setThreads] = useState<Record<string, ThreadState>>({});

    // Latest active thread, readable from socket handlers without re-subscribing.
    const activeRef = useRef<{ userId: string | null; dockOpen: boolean }>({ userId: null, dockOpen: false });
    useEffect(() => {
        activeRef.current = { userId: activeUserId, dockOpen };
    }, [activeUserId, dockOpen]);

    const refreshConversations = useCallback(async () => {
        if (!userId) {
            setConversations([]);
            setTotalUnread(0);
            return;
        }
        try {
            const res = await fetch('/api/messages');
            if (!res.ok) return;
            const data = await res.json();
            setConversations(data.conversations ?? []);
            setTotalUnread(data.totalUnread ?? 0);
        } catch {
            /* transient */
        }
    }, [userId]);

    // Debounced refresh to coalesce bursts of incoming messages.
    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduleRefresh = useCallback(() => {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => refreshConversations(), 300);
    }, [refreshConversations]);

    const loadThread = useCallback(
        async (other: string) => {
            if (!userId || !other) return;
            setThreads(prev => ({
                ...prev,
                [other]: { partner: prev[other]?.partner ?? null, messages: prev[other]?.messages ?? [], loading: true },
            }));
            try {
                const res = await fetch(`/api/messages/${other}`);
                if (!res.ok) return;
                const data = await res.json();
                setThreads(prev => ({
                    ...prev,
                    [other]: { partner: data.partner ?? null, messages: data.messages ?? [], loading: false },
                }));
                // Reading the thread cleared server-side unread → refresh badge.
                scheduleRefresh();
            } catch {
                setThreads(prev => ({ ...prev, [other]: { ...(prev[other] ?? { partner: null, messages: [] }), loading: false } }));
            }
        },
        [userId, scheduleRefresh],
    );

    const openDock = useCallback(() => setDockOpen(true), []);
    const closeDock = useCallback(() => {
        setDockOpen(false);
        setActiveUserId(null);
    }, []);
    const closeThread = useCallback(() => setActiveUserId(null), []);

    // Opens the dock on a conversation; the mounted DmThread fetches + marks it read.
    const openThread = useCallback((other: string) => {
        setDockOpen(true);
        setActiveUserId(other);
    }, []);

    const sendMessage = useCallback(
        async (other: string, raw: string) => {
            const text = raw.trim();
            if (!userId || !other || !text) return;
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const temp: DMMessage = {
                id: tempId,
                senderId: userId,
                recipientId: other,
                body: text,
                createdAt: new Date().toISOString(),
                readAt: null,
                pending: true,
            };
            setThreads(prev => ({
                ...prev,
                [other]: {
                    partner: prev[other]?.partner ?? null,
                    messages: mergeMessage(prev[other]?.messages ?? [], temp),
                    loading: prev[other]?.loading ?? false,
                },
            }));
            try {
                const res = await fetch(`/api/messages/${other}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ body: text }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setThreads(prev => ({
                        ...prev,
                        [other]: {
                            partner: prev[other]?.partner ?? null,
                            messages: mergeMessage(prev[other]?.messages ?? [], data.message),
                            loading: prev[other]?.loading ?? false,
                        },
                    }));
                    scheduleRefresh();
                } else {
                    setThreads(prev => ({
                        ...prev,
                        [other]: {
                            partner: prev[other]?.partner ?? null,
                            messages: (prev[other]?.messages ?? []).map(m =>
                                m.id === tempId ? { ...m, pending: false, failed: true } : m,
                            ),
                            loading: prev[other]?.loading ?? false,
                        },
                    }));
                }
            } catch {
                setThreads(prev => ({
                    ...prev,
                    [other]: {
                        partner: prev[other]?.partner ?? null,
                        messages: (prev[other]?.messages ?? []).map(m =>
                            m.id === tempId ? { ...m, pending: false, failed: true } : m,
                        ),
                        loading: prev[other]?.loading ?? false,
                    },
                }));
            }
        },
        [userId, scheduleRefresh],
    );

    // Initial load + poll fallback + refresh on focus.
    useEffect(() => {
        if (!userId) {
            setConversations([]);
            setTotalUnread(0);
            return;
        }
        refreshConversations();
        const interval = setInterval(refreshConversations, 30_000);
        const onVisible = () => {
            if (document.visibilityState === 'visible') refreshConversations();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [userId, refreshConversations]);

    // Realtime delivery.
    useEffect(() => {
        if (!socket || !userId) return;
        const onMessage = (msg: DMMessage) => {
            if (!msg?.id) return;
            const partner = msg.senderId === userId ? msg.recipientId : msg.senderId;

            // Append to the thread if it's already loaded in the cache.
            setThreads(prev => {
                if (!prev[partner]) return prev;
                return { ...prev, [partner]: { ...prev[partner], messages: mergeMessage(prev[partner].messages, msg) } };
            });

            const incoming = msg.recipientId === userId;
            const isActive = activeRef.current.dockOpen && activeRef.current.userId === partner;
            if (incoming && isActive && document.visibilityState === 'visible') {
                // Thread is open in front of the user → clear server-side unread.
                fetch(`/api/messages/${partner}`, { method: 'GET' }).catch(() => {});
            }
            scheduleRefresh();
        };
        socket.on('dm:message', onMessage);
        return () => {
            socket.off('dm:message', onMessage);
        };
    }, [socket, userId, scheduleRefresh]);

    const value: MessagesContextType = {
        conversations,
        totalUnread,
        dockOpen,
        activeUserId,
        threads,
        refreshConversations,
        loadThread,
        openThread,
        closeThread,
        openDock,
        closeDock,
        sendMessage,
    };

    return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
    const ctx = useContext(MessagesContext);
    if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
    return ctx;
}
