// src/hooks/useServerWarmup.ts
import { useEffect, useState } from 'react';

type Status = 'checking' | 'warming' | 'ready' | 'error';

/**
 * Pings a server's /health endpoint before the socket connects.
 * On Render free tier, this HTTP request wakes the sleeping service.
 * socket.io-client then auto-reconnects once the server responds.
 */
export function useServerWarmup(serverUrl: string | undefined): {
    status: Status;
    warming: boolean;
    ready: boolean;
} {
    const [status, setStatus] = useState<Status>('checking');

    useEffect(() => {
        if (!serverUrl) { setStatus('ready'); return; }

        let cancelled = false;
        const deadline = Date.now() + 70_000;

        async function poll() {
            // Fast first check — if the server is already up, no delay
            let firstTry = true;
            while (Date.now() < deadline) {
                try {
                    const res = await fetch(`${serverUrl}/health`, {
                        signal: AbortSignal.timeout(5_000),
                        cache: 'no-store',
                    });
                    if (!cancelled && res.ok) { setStatus('ready'); return; }
                } catch { /* still sleeping */ }
                if (cancelled) return;
                if (firstTry) { setStatus('warming'); firstTry = false; }
                await new Promise(r => setTimeout(r, 3_000));
            }
            if (!cancelled) setStatus('error');
        }

        poll();
        return () => { cancelled = true; };
    }, [serverUrl]);

    return {
        status,
        warming: status === 'checking' || status === 'warming',
        ready: status === 'ready',
    };
}
