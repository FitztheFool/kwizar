'use client';

// Hook partagé qui charge /api/me/summary via SWR. Les 3 providers globaux
// (Friends / Notifications / Messages) l'appellent avec la MÊME clé → SWR
// déduplique en UNE seule requête + UN seul poll pour toute l'app.
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { fetcher } from '@/lib/swr';
import type { InviteToast, AppNotification } from '@/context/NotificationsContext';
import type { Conversation } from '@/context/MessagesContext';

export interface MeSummary {
    friendRequests: number;
    invites: InviteToast[];
    conversations: Conversation[];
    totalUnread: number;
    notifications: AppNotification[];
}

export function useMeSummary() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    return useSWR<MeSummary>(userId ? '/api/me/summary' : null, fetcher, {
        refreshInterval: 30_000,
        revalidateOnFocus: true,
    });
}
