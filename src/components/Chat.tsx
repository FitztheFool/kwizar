'use client';

import { useState } from 'react';

type ChatMessage = { userId: string; username: string; text: string; sentAt: number };

interface ChatProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
}

export default function Chat({ messages, onSend }: ChatProps) {
    const [chatText, setChatText] = useState('');

    const sendChat = () => {
        const text = chatText.trim();
        if (!text) return;
        onSend(text);
        setChatText('');
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-3 dark:text-white">Chat</h2>
            <div className="h-64 overflow-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                {messages.map((m, i) => (
                    <div key={i} className="mb-2 text-gray-700 dark:text-gray-200">
                        <b>{m.username}</b>: {m.text}
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="text-sm opacity-60 dark:text-gray-400">Aucun message…</div>
                )}
            </div>
            <div className="mt-3 flex flex-col gap-2">
                <input
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Écrire un message…"
                />
                <button
                    onClick={sendChat}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    Envoyer
                </button>
            </div>
        </div>
    );
}
