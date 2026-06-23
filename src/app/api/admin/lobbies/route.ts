import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

// Les lobbies vivent en mémoire sur le lobby-server (socket.io), pas en base.
// On interroge son endpoint interne, protégé par INTERNAL_API_KEY.
const LOBBY_BASE = process.env.NEXT_PUBLIC_LOBBY_SERVER_URL;
const KEY = process.env.INTERNAL_API_KEY;

// Liste des lobbies actifs (admin uniquement).
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;
    if (!LOBBY_BASE || !KEY) {
        return NextResponse.json({ error: 'Lobby-server non configuré' }, { status: 503 });
    }
    try {
        const res = await fetch(`${LOBBY_BASE}/internal/lobbies`, {
            headers: { Authorization: `Bearer ${KEY}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return NextResponse.json({ error: 'Lobby-server injoignable' }, { status: 502 });
        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json({ error: 'Lobby-server injoignable' }, { status: 502 });
    }
}

// Forcer la fermeture d'un lobby (admin uniquement).
export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;
    if (!LOBBY_BASE || !KEY) {
        return NextResponse.json({ error: 'Lobby-server non configuré' }, { status: 503 });
    }
    let body: { lobbyId?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
    }
    if (typeof body.lobbyId !== 'string') {
        return NextResponse.json({ error: 'lobbyId manquant' }, { status: 400 });
    }
    try {
        const res = await fetch(`${LOBBY_BASE}/internal/lobbies/close`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId: body.lobbyId }),
            signal: AbortSignal.timeout(5_000),
        });
        if (res.status === 404) return NextResponse.json({ error: 'Lobby introuvable' }, { status: 404 });
        if (!res.ok) return NextResponse.json({ error: 'Lobby-server injoignable' }, { status: 502 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Lobby-server injoignable' }, { status: 502 });
    }
}
