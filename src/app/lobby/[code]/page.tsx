'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';

type Player = { userId: string; username: string };

type LobbyState = {
    hostId: string | null;
    quizId: string | null;
    status: 'WAITING' | 'PLAYING' | string;
    timePerQuestion: number;
    players: Player[];
};

type ChatMessage = {
    userId: string;
    username: string;
    text: string;
    sentAt: number;
};

export default function LobbyPage() {
    // ✅ Hooks toujours appelés
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams<{ code: string }>();
    const lobbyId = params?.code ?? '';

    const socket = useMemo(() => getSocket(), []);
    const joinedRef = useRef(false);

    const [lobby, setLobby] = useState<LobbyState>({
        hostId: null,
        quizId: null,
        status: 'WAITING',
        timePerQuestion: 15,
        players: [],
    });

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatText, setChatText] = useState('');

    // ✅ Redirect login (jamais dans le render)
    useEffect(() => {
        if (!lobbyId) return;

        // quand NextAuth a fini de charger et que c'est non-auth
        if (status === 'unauthenticated') {
            router.replace(`/login?callbackUrl=${encodeURIComponent(`/lobby/${lobbyId}`)}`);
        }
    }, [status, router, lobbyId]);

    // ✅ Join lobby + listeners (seulement si on a session)
    useEffect(() => {
        if (!lobbyId) return;
        if (status !== 'authenticated') return;
        if (!session?.user?.id) return;

        const meUserId = session.user.id;
        const meUsername = session.user.username ?? session.user.email ?? 'User';

        const onState = (state: LobbyState) => setLobby(state);
        const onChatNew = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

        socket.on('lobby:state', onState);
        socket.on('chat:new', onChatNew);

        // join une seule fois
        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit('lobby:join', { lobbyId, userId: meUserId, username: meUsername });
        }

        return () => {
            // leave propre
            socket.emit('lobby:leave');
            socket.off('lobby:state', onState);
            socket.off('chat:new', onChatNew);
            joinedRef.current = false;
        };
    }, [socket, lobbyId, status, session?.user?.id, session?.user?.username, session?.user?.email]);

    // ✅ Maintenant seulement : rendu conditionnel (après hooks)
    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    if (status !== 'authenticated' || !session?.user?.id) {
        // le useEffect fera la redirection si unauthenticated
        return null;
    }

    const me = {
        userId: session.user.id,
        username: session.user.username ?? session.user.email ?? 'User',
    };

    const isHost = lobby.hostId === me.userId;

    const sendChat = () => {
        const text = chatText.trim();
        if (!text) return;
        socket.emit('chat:send', { text });
        setChatText('');
    };

    const setTime = (t: number) => {
        socket.emit('lobby:setTimePerQuestion', { timePerQuestion: t });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            Lobby <span className="font-mono">{lobbyId}</span>
                        </h1>
                        <p className="text-sm opacity-70">
                            {isHost ? '👑 Vous êtes Host' : lobby.hostId ? 'En attente du host…' : 'Connexion…'}
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                        Quitter
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Col gauche: joueurs + settings */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h2 className="font-bold text-lg mb-3">Participants</h2>

                        <div className="space-y-2">
                            {lobby.players.map((p) => (
                                <div key={p.userId} className="flex items-center justify-between border rounded-lg p-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{p.username}</span>
                                        {p.userId === lobby.hostId && <span title="Host">👑</span>}
                                        {p.userId === me.userId && <span className="text-xs opacity-60">(moi)</span>}
                                    </div>
                                    {/*<span className="text-xs opacity-60">{p.userId.slice(0, 6)}</span>*/}
                                </div>
                            ))}

                            {lobby.players.length === 0 && (
                                <div className="text-sm opacity-60">Personne pour l’instant…</div>
                            )}
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-semibold mb-2">Temps par question</label>
                            <select
                                value={lobby.timePerQuestion}
                                onChange={(e) => setTime(Number(e.target.value))}
                                disabled={!isHost}
                                className="w-full border rounded-lg px-3 py-2 bg-white disabled:opacity-60"
                            >
                                {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((t) => (
                                    <option key={t} value={t}>
                                        {t}s
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs opacity-60 mt-2">
                                {isHost ? 'Vous pouvez modifier.' : 'Seul le host peut modifier.'}
                            </p>
                        </div>
                    </div>

                    {/* Centre: zone quiz (placeholder) */}
                    <div className="bg-white rounded-xl p-4 shadow-sm lg:col-span-1">
                        <h2 className="font-bold text-lg mb-3">Quiz</h2>
                        <div className="text-sm opacity-70">
                            (placeholder) Ici on mettra la liste des quiz sélectionnables par le host + affichage pour les autres.
                        </div>

                        <div className="mt-4 text-sm">
                            <div>
                                <span className="font-semibold">Quiz choisi :</span>{' '}
                                <span className="font-mono">{lobby.quizId ?? 'Aucun'}</span>
                            </div>
                            <div className="mt-1">
                                <span className="font-semibold">Statut :</span> {lobby.status}
                            </div>
                        </div>
                    </div>

                    {/* Droite: chat */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h2 className="font-bold text-lg mb-3">Chat</h2>

                        <div className="h-64 overflow-auto border rounded-lg p-3 bg-gray-50">
                            {messages.map((m, i) => (
                                <div key={i} className="mb-2">
                                    <b>{m.username}</b>: {m.text}
                                </div>
                            ))}
                            {messages.length === 0 && <div className="text-sm opacity-60">Aucun message…</div>}
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                value={chatText}
                                onChange={(e) => setChatText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') sendChat();
                                }}
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="Écrire un message…"
                            />
                            <button
                                onClick={sendChat}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
