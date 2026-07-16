import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate-limit distribué sur Upstash Redis.
//
// L'ancienne implémentation utilisait une Map en mémoire de process : inefficace en
// serverless (Vercel), où chaque instance a sa propre Map — la limite réelle valait
// donc `limit × nombre d'instances`, remise à zéro à chaque cold start. Un brute-force
// login/register passait sous le radar. Redis donne un compteur unique, partagé entre
// toutes les instances.
//
// Upstash est requis : REST/HTTP (pas de connexion TCP persistante), donc compatible
// serverless et edge. En l'absence des variables d'environnement, on échoue au démarrage
// plutôt que de dégrader silencieusement la protection.

function makeRedis(): Redis {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        throw new Error(
            'Rate-limit : UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN sont requis. ' +
            'Crée une base sur upstash.com et renseigne ces variables.',
        );
    }
    return new Redis({ url, token });
}

// Instancié paresseusement : le module peut être importé sans Redis (build, typecheck),
// l'erreur ne survient qu'au premier appel réel.
let redis: Redis | null = null;
function getRedis(): Redis {
    return (redis ??= makeRedis());
}

// Un Ratelimit par couple (limit, windowMs), mémoïsé : Upstash fige la fenêtre à la
// construction, or les appelants passent des paramètres variés (1/min, 40/15min…).
const limiters = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowMs: number): Ratelimit {
    const cacheKey = `${limit}:${windowMs}`;
    let rl = limiters.get(cacheKey);
    if (!rl) {
        rl = new Ratelimit({
            redis: getRedis(),
            // Fenêtre glissante : plus juste qu'une fenêtre fixe pour un anti-abus.
            limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
            // Préfixe commun → toutes les clés vivent sous "rl:" dans Redis.
            prefix: 'rl',
        });
        limiters.set(cacheKey, rl);
    }
    return rl;
}

export function getIp(req: NextRequest): string {
    // Préférer x-real-ip (posé par le reverse proxy, non forgeable par le client)
    // avant x-forwarded-for dont le premier élément peut être falsifié.
    return (
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
        'unknown'
    );
}

/**
 * Consomme une unité de quota pour `key`. Signature identique à l'ancienne version
 * (synchrone → async) : les appelants n'ajoutent qu'un `await`.
 *
 * `retryAfter` est en secondes, arrondi à l'unité supérieure, pour l'en-tête HTTP
 * `Retry-After`.
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
    const { success, reset } = await getLimiter(limit, windowMs).limit(key);
    if (success) return { allowed: true, retryAfter: 0 };
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: false, retryAfter };
}
