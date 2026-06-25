'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeckForm, { DeckFormInitial, DeckPayload } from '@/components/Duel/DeckForm';

interface DeckDTO {
    title: string;
    emoji: string;
    imageUrl: string | null;
    isPublic: boolean;
    items: { name: string; imageUrl: string | null }[];
}

export default function DuelEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [initial, setInitial] = useState<DeckFormInitial | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/duel/${id}`);
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    setError(data?.error ?? 'Duel introuvable');
                    return;
                }
                const d: DeckDTO = await res.json();
                setInitial({
                    title: d.title,
                    emoji: d.emoji,
                    isPublic: d.isPublic,
                    cover: d.imageUrl ?? '',
                    items: d.items.map(i => ({ name: i.name, imageUrl: i.imageUrl ?? '' })),
                });
            } catch {
                setError('Erreur de chargement');
            }
        })();
    }, [id]);

    const onSubmit = async (payload: DeckPayload): Promise<string | null> => {
        try {
            const res = await fetch(`/api/duel/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                return data?.error ?? 'Échec de la modification';
            }
            router.push('/game/duel');
            return null;
        } catch (e) {
            return e instanceof Error ? e.message : 'Erreur serveur';
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-gray-300">{error}</p>
                <Link href="/game/duel" className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-400">
                    Retour aux Duels
                </Link>
            </div>
        );
    }

    if (!initial) {
        return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">Chargement…</div>;
    }

    return (
        <DeckForm
            heading="Modifier le Duel"
            submitLabel="Enregistrer"
            cancelHref="/game/duel"
            initial={initial}
            onSubmit={onSubmit}
        />
    );
}
