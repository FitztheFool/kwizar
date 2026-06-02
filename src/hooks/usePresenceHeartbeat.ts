'use client';

import { useEffect } from 'react';

/**
 * Keeps the current user's `lastSeen` fresh (online status) by pinging the
 * presence endpoint on mount, every 60s, and whenever the tab regains focus.
 * No-op when `enabled` is false (logged-out users).
 */
export function usePresenceHeartbeat(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;
        const ping = () => {
            fetch('/api/presence/ping', { method: 'POST' }).catch(() => {});
        };
        ping();
        const interval = setInterval(ping, 60_000);
        const onVisible = () => {
            if (document.visibilityState === 'visible') ping();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [enabled]);
}
