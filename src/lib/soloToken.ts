import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET!;

export function createSoloToken(userId: string, gameType: string): string {
    const payload = Buffer.from(JSON.stringify({ sub: userId, game: gameType, iat: Date.now() })).toString('base64url');
    const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

export type TokenError = 'invalid' | 'expired' | 'too_fast' | 'wrong_user' | 'wrong_game';

export function verifySoloToken(
    token: string,
    userId: string,
    gameType: string,
    minDurationMs: number,
): { ok: true } | { ok: false; error: TokenError } {
    const dot = token.indexOf('.');
    if (dot === -1) return { ok: false, error: 'invalid' };

    const payloadB64 = token.slice(0, dot);
    const sig        = token.slice(dot + 1);

    const expectedSig = createHmac('sha256', SECRET).update(payloadB64).digest('base64url');

    // timingSafeEqual requires identical lengths
    if (sig.length !== expectedSig.length) return { ok: false, error: 'invalid' };
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return { ok: false, error: 'invalid' };

    let payload: { sub: string; game: string; iat: number };
    try {
        payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    } catch {
        return { ok: false, error: 'invalid' };
    }

    if (payload.sub  !== userId)   return { ok: false, error: 'wrong_user' };
    if (payload.game !== gameType) return { ok: false, error: 'wrong_game' };

    const age = Date.now() - payload.iat;
    if (age > 2 * 60 * 60 * 1000) return { ok: false, error: 'expired' };
    if (age < minDurationMs)       return { ok: false, error: 'too_fast' };

    return { ok: true };
}
