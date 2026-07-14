'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DeckForm, { DeckPayload } from '@/components/Duel/DeckForm';

export default function DuelCreatePage() {
    const router = useRouter();
    const { status } = useSession();

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-transparent text-gray-900 dark:text-white flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-gray-300">Connecte-toi pour créer ton Duel.</p>
                <Link href="/login?callbackUrl=/game/duel/create" className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-400">
                    Se connecter
                </Link>
            </div>
        );
    }

    const onSubmit = async (payload: DeckPayload): Promise<string | null> => {
        try {
            const res = await fetch('/api/duel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                return data?.error ?? 'Échec de la création';
            }
            router.push('/game/duel');
            return null;
        } catch (e) {
            return e instanceof Error ? e.message : 'Erreur serveur';
        }
    };

    return (
        <DeckForm
            heading="Crée ton Duel"
            submitLabel="Créer"
            cancelHref="/game/duel"
            onSubmit={onSubmit}
        />
    );
}
