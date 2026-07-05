// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

// ── Token cache ───────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 12 * 60 * 1000; // refresh 3 min before the 15 min server expiry

async function getSocketToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now - tokenFetchedAt < TOKEN_TTL_MS) return cachedToken;
    try {
        const res = await fetch('/api/socket-token');
        if (res.status === 401) return '';
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        cachedToken = data.token as string;
        tokenFetchedAt = now;
        return cachedToken;
    } catch (err) {
        console.error('❌ socket-token fetch failed:', err);
        return '';
    }
}

// ── Socket factory ────────────────────────────────────────────────────────────
// ⚠️ Les accès `process.env.NEXT_PUBLIC_*` doivent rester LITTÉRAUX (inlinés au
// build par Next) — pas d'accès dynamique par clé.

const GAME_SERVERS = {
    lobby:        { url: process.env.NEXT_PUBLIC_LOBBY_SERVER_URL          ?? "http://localhost:10000", name: "Lobby Socket" },
    uno:          { url: process.env.NEXT_PUBLIC_UNO_SERVER_URL            ?? "http://localhost:10001", name: "UNO Socket" },
    quiz:         { url: process.env.NEXT_PUBLIC_QUIZ_SERVER_URL           ?? "http://localhost:10002", name: "Quiz Socket" },
    taboo:        { url: process.env.NEXT_PUBLIC_TABOO_SERVER_URL          ?? "http://localhost:10003", name: "Taboo Socket" },
    skyjow:       { url: process.env.NEXT_PUBLIC_SKYJOW_SERVER_URL         ?? "http://localhost:10004", name: "Skyjow Socket" },
    yahtzee:      { url: process.env.NEXT_PUBLIC_YAHTZEE_SERVER_URL        ?? "http://localhost:10005", name: "Yahtzee Socket" },
    puissance4:   { url: process.env.NEXT_PUBLIC_PUISSANCE4_SERVER_URL     ?? "http://localhost:10006", name: "Puissance 4 Socket" },
    justOne:      { url: process.env.NEXT_PUBLIC_JUSTONE_SERVER_URL        ?? "http://localhost:10007", name: "Just One Socket" },
    battleship:   { url: process.env.NEXT_PUBLIC_BATTLESHIP_SERVER_URL     ?? "http://localhost:10008", name: "Battleship Socket" },
    diamant:      { url: process.env.NEXT_PUBLIC_DIAMANT_SERVER_URL        ?? "http://localhost:10009", name: "Diamant Socket" },
    impostor:     { url: process.env.NEXT_PUBLIC_IMPOSTOR_SERVER_URL       ?? "http://localhost:10010", name: "Impostor Socket" },
    ludo:         { url: process.env.NEXT_PUBLIC_LUDO_SERVER_URL           ?? "http://localhost:10011", name: "Ludo Socket" },
    perudo:       { url: process.env.NEXT_PUBLIC_PERUDO_SERVER_URL         ?? "http://localhost:10012", name: "Perudo Socket" },
    cantStop:     { url: process.env.NEXT_PUBLIC_CANT_STOP_SERVER_URL      ?? "http://localhost:10013", name: "Can't Stop Socket" },
    milleBornes:  { url: process.env.NEXT_PUBLIC_MILLE_BORNES_SERVER_URL   ?? "http://localhost:10014", name: "Mille Bornes Socket" },
    spyfall:      { url: process.env.NEXT_PUBLIC_SPYFALL_SERVER_URL        ?? "http://localhost:10015", name: "Spyfall Socket" },
    atlantide:    { url: process.env.NEXT_PUBLIC_ATLANTIDE_SERVER_URL      ?? "http://localhost:10016", name: "Atlantide Socket" },
    abalone:      { url: process.env.NEXT_PUBLIC_ABALONE_SERVER_URL        ?? "http://localhost:10017", name: "Abalone Socket" },
    blokus:       { url: process.env.NEXT_PUBLIC_BLOKUS_SERVER_URL         ?? "http://localhost:10018", name: "Blokus Socket" },
    sixQuiPrend:  { url: process.env.NEXT_PUBLIC_SIX_QUI_PREND_SERVER_URL  ?? "http://localhost:10019", name: "6 qui prend Socket" },
    tanks:        { url: process.env.NEXT_PUBLIC_TANKS_SERVER_URL          ?? "http://localhost:10020", name: "Tanks Socket" },
    complot:      { url: process.env.NEXT_PUBLIC_COMPLOT_SERVER_URL        ?? "http://localhost:10021", name: "Complot Socket" },
    dames:        { url: process.env.NEXT_PUBLIC_DAMES_SERVER_URL          ?? "http://localhost:10022", name: "Dames Socket" },
} as const;

export type GameSocketKey = keyof typeof GAME_SERVERS;

const sockets = new Map<GameSocketKey, Socket>();

function createSocket(url: string, name: string): Socket {
    const socket = io(url, {
        transports: ["websocket"],
        withCredentials: true,
        autoConnect: false,
        auth: (cb) => {
            getSocketToken().then((token) => cb({ token }));
        },
    });
    socket.on("connect", () => console.log(`✅ ${name} connecté`, socket.id));
    socket.on("connect_error", (err) => {
        if ((err as { message?: string }).message === 'auth_required') return;
        console.error(`❌ ${name} error:`, err);
    });
    return socket;
}

function connectIfAuth(socket: Socket): void {
    getSocketToken().then(token => {
        if (token && !socket.connected) socket.connect();
    });
}

/** Socket singleton par serveur de jeu (créé au premier accès, connecté si authentifié). */
export function getGameSocket(key: GameSocketKey): Socket | null {
    if (typeof window === "undefined") return null;
    let socket = sockets.get(key);
    if (!socket) {
        const { url, name } = GAME_SERVERS[key];
        socket = createSocket(url, name);
        sockets.set(key, socket);
    }
    connectIfAuth(socket);
    return socket;
}

// ── Accesseurs historiques (compat) ───────────────────────────────────────────

export const getLobbySocket = () => getGameSocket('lobby');
export const getUnoSocket = () => getGameSocket('uno');
export const getQuizSocket = () => getGameSocket('quiz');
export const getTabooSocket = () => getGameSocket('taboo');
export const getSkyjowSocket = () => getGameSocket('skyjow');
export const getYahtzeeSocket = () => getGameSocket('yahtzee');
export const getPuissance4Socket = () => getGameSocket('puissance4');
export const getJustOneSocket = () => getGameSocket('justOne');
export const getBattleshipSocket = () => getGameSocket('battleship');
export const getDiamantSocket = () => getGameSocket('diamant');
export const getImpostorSocket = () => getGameSocket('impostor');
export const getLudoSocket = () => getGameSocket('ludo');
export const getPerudoSocket = () => getGameSocket('perudo');
export const getCantStopSocket = () => getGameSocket('cantStop');
export const getMilleBornesSocket = () => getGameSocket('milleBornes');
export const getSpyfallSocket = () => getGameSocket('spyfall');
export const getAtlantideSocket = () => getGameSocket('atlantide');
export const getAbaloneSocket = () => getGameSocket('abalone');
export const getBlokusSocket = () => getGameSocket('blokus');
export const getSixQuiPrendSocket = () => getGameSocket('sixQuiPrend');
export const getTanksSocket = () => getGameSocket('tanks');
export const getComplotSocket = () => getGameSocket('complot');
export const getDamesSocket = () => getGameSocket('dames');
