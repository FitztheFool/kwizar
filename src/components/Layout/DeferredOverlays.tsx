'use client';

// Overlays non critiques (chat flottant, dock de messages, toasts, palette de
// commandes) : aucun n'est requis pour le premier rendu. On les charge en chunks
// séparés (ssr:false) et on ne les monte qu'après le premier idle, pour les sortir
// du chemin critique et du bundle initial de CHAQUE page.

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const FloatingChat = dynamic(() => import('@/components/Chat/FloatingChat'), { ssr: false });
const MessagesDock = dynamic(() => import('@/components/Messages/MessagesDock'), { ssr: false });
const Toasts = dynamic(() => import('@/components/Notifications/Toasts'), { ssr: false });
const CommandPalette = dynamic(() => import('@/components/CommandPalette'), { ssr: false });

export default function DeferredOverlays() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
        const id = w.requestIdleCallback
            ? w.requestIdleCallback(() => setReady(true))
            : window.setTimeout(() => setReady(true), 200);
        return () => {
            const cancel = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
            if (cancel) cancel(id as number); else clearTimeout(id as number);
        };
    }, []);

    if (!ready) return null;

    return (
        <div data-print-hide>
            <FloatingChat />
            <MessagesDock />
            <Toasts />
            <CommandPalette />
        </div>
    );
}
