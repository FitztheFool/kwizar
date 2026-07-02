// src/context/FriendsContext.tsx
'use client';

import { createContext, useCallback, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useMeSummary } from '@/hooks/useMeSummary';

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

    // Heartbeat for online presence (only while logged in).
    usePresenceHeartbeat(!!userId);

    // Compteur alimenté par le résumé partagé (/api/me/summary, dédupliqué par SWR).
    const { data, mutate } = useMeSummary();
    const pendingCount = data?.friendRequests ?? 0;
    const refresh = useCallback(() => { void mutate(); }, [mutate]);

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
