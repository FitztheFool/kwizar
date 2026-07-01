import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { GAME_URL_SLUGS } from '@/lib/gameConfig';

const PROTECTED_PREFIXES = ['/dashboard', '/lobby', '/game', '/friends', '/messages'];

// Slugs des jeux multijoueurs (/uno, /skyjow, /diamant…). Leurs pages de partie
// (/slug/:lobbyId/:gameId) sont au top-level, hors des PROTECTED_PREFIXES → on
// protège tout chemin dont le 1er segment est un slug de jeu.
const GAME_SLUG_SET = new Set<string>(GAME_URL_SLUGS);

// Matches /[game]/[lobbyId] only when lobbyId looks like a UUID or cuid (not a filename)
const GAME_LOBBYID_RE = new RegExp(`^/(${GAME_URL_SLUGS.join('|')})/([a-zA-Z0-9_-]{8,})$`);

export default auth(function middleware(req) {
    const { pathname } = req.nextUrl;

    // /[game]/[lobbyId] (no gameId) → redirect to lobby
    const gameMatch = pathname.match(GAME_LOBBYID_RE);
    if (gameMatch) {
        return NextResponse.redirect(new URL(`/lobby/create/${gameMatch[2]}`, req.url));
    }

    const isProtected =
        PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) ||
        GAME_SLUG_SET.has(pathname.split('/')[1]);
    if (isProtected && !req.auth) {
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
