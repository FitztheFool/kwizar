import { NextResponse } from 'next/server';

// Nombre de lobbies actifs (public, pour l'accueil). Proxy vers l'endpoint
// interne du lobby-server (clé serveur), ne renvoie qu'un compteur.
const LOBBY_BASE = process.env.NEXT_PUBLIC_LOBBY_SERVER_URL;
const KEY = process.env.INTERNAL_API_KEY;

export const revalidate = 10;

export async function GET() {
    if (!LOBBY_BASE || !KEY) return NextResponse.json({ count: null });
    try {
        const res = await fetch(`${LOBBY_BASE}/internal/lobbies`, {
            headers: { Authorization: `Bearer ${KEY}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(4_000),
        });
        if (!res.ok) return NextResponse.json({ count: null });
        const data = await res.json();
        const count = typeof data.total === 'number' ? data.total : (Array.isArray(data.lobbies) ? data.lobbies.length : 0);
        return NextResponse.json({ count });
    } catch {
        return NextResponse.json({ count: null });
    }
}
