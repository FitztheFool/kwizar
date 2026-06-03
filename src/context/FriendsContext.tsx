// src/context/FriendsContext.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';

type FriendsContextType = {
    /** Number of incoming pending friend requests (drives the header badge). */
    pendingCount: number;
    /** Re-fetch the pending count (call after accepting/declining/sending). */
    refresh: () => void;
};

const FriendsContext = createContext<FriendsContextType | null>(null);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [pendingCount, setPendingCount] = useState(0);

    // Heartbeat for online presence (only while logged in).
    usePresenceHeartbeat(!!userId);

    const refresh = useCallback(async () => {
        if (!userId) {
            setPendingCount(0);
            return;
        }
        try {
            const res = await fetch('/api/friends/requests');
            if (!res.ok) return;
            const data = await res.json();
            setPendingCount(Array.isArray(data.incoming) ? data.incoming.length : 0);
        } catch {
            /* ignore transient errors */
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setPendingCount(0);
            return;
        }
        refresh();
        const interval = setInterval(refresh, 30_000);
        const onVisible = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [userId, refresh]);

    return (
        <FriendsContext.Provider value={{ pendingCount, refresh }}>
            {children}
        </FriendsContext.Provider>
    );
}

export function useFriends() {
    const ctx = useContext(FriendsContext);
    if (!ctx) throw new Error('useFriends must be used within FriendsProvider');
    return ctx;
}
