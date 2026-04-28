import { NextRequest } from 'next/server';

const store = new Map<string, { count: number; resetAt: number }>();

export function getIp(req: NextRequest): string {
    // Préférer x-real-ip (posé par le reverse proxy, non forgeable par le client)
    // avant x-forwarded-for dont le premier élément peut être falsifié
    return (
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
        'unknown'
    );
}

export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; retryAfter: number } {
    const now = Date.now();

    // Purge des entrées expirées pour éviter la fuite mémoire
    for (const [k, e] of store) {
        if (now > e.resetAt) store.delete(k);
    }

    const entry = store.get(key);

    if (!entry) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
    }

    if (entry.count >= limit) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count++;
    return { allowed: true, retryAfter: 0 };
}
