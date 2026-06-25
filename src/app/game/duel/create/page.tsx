'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { uploadToCloudinary } from '@/lib/uploadToCloudinary';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/solid';
import { TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

const MIN_ITEMS = 4;
const MAX_ITEMS = 32;

interface ItemForm { name: string; imageUrl: string; uploading: boolean; }
const emptyItem = (): ItemForm => ({ name: '', imageUrl: '', uploading: false });

export default function DuelCreatePage() {
    const router = useRouter();
    const { status } = useSession();

    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState('🆚');
    const [isPublic, setIsPublic] = useState(true);
    const [cover, setCover] = useState('');
    const [coverUploading, setCoverUploading] = useState(false);
    const [items, setItems] = useState<ItemForm[]>([emptyItem(), emptyItem(), emptyItem(), emptyItem()]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
    const coverInput = useRef<HTMLInputElement | null>(null);

    const onPickCover = async (file: File | undefined) => {
        if (!file) return;
        setCoverUploading(true);
        try {
            setCover(await uploadToCloudinary(file, 'duel'));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Échec de l'upload");
        } finally {
            setCoverUploading(false);
        }
    };

    const setItem = useCallback((idx: number, patch: Partial<ItemForm>) => {
        setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    }, []);

    const addItem = () => setItems(prev => (prev.length >= MAX_ITEMS ? prev : [...prev, emptyItem()]));
    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const onPickFile = async (idx: number, file: File | undefined) => {
        if (!file) return;
        setItem(idx, { uploading: true });
        try {
            const url = await uploadToCloudinary(file, 'duel');
            setItem(idx, { imageUrl: url, uploading: false });
        } catch (e) {
            setItem(idx, { uploading: false });
            setError(e instanceof Error ? e.message : "Échec de l'upload");
        }
    };

    const filledCount = items.filter(i => i.name.trim()).length;

    const submit = async () => {
        setError(null);
        if (!title.trim()) { setError('Donne un titre (ex. « Le meilleur super-héros »).'); return; }
        const valid = items.filter(i => i.name.trim());
        if (valid.length < MIN_ITEMS) { setError(`Il faut au moins ${MIN_ITEMS} items avec un nom.`); return; }

        setSaving(true);
        try {
            const res = await fetch('/api/duel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    emoji: emoji.trim() || '🆚',
                    isPublic,
                    imageUrl: cover.trim() || null,
                    items: valid.map(i => ({ name: i.name.trim(), imageUrl: i.imageUrl.trim() || null })),
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? 'Échec de la création');
            }
            router.push('/game/duel');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur serveur');
            setSaving(false);
        }
    };

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-gray-300">Connecte-toi pour créer ton Duel.</p>
                <Link href="/login?callbackUrl=/game/duel/create" className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-400">
                    Se connecter
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white px-4 sm:px-8 py-8">
            <div className="mx-auto max-w-2xl">
                <Link href="/game/duel" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
                    <ArrowLeftIcon className="w-4 h-4" /> Retour aux catégories
                </Link>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Crée ton Duel</h1>
                <p className="text-gray-400 mb-8">Ajoute un thème et les items à départager. Minimum {MIN_ITEMS}, maximum {MAX_ITEMS}.</p>

                {/* Réglages du deck */}
                <div className="space-y-4 rounded-xl border border-white/10 bg-zinc-800/50 p-4 mb-6">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Titre</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Le meilleur super-héros"
                                maxLength={80}
                                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div className="w-20">
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Emoji</label>
                            <input
                                value={emoji}
                                onChange={e => setEmoji(e.target.value)}
                                maxLength={4}
                                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                    </div>
                    {/* Cover (optionnel) — sinon la 1re image d'item sert de couverture */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
                            Image de couverture <span className="text-gray-500 normal-case font-normal">(optionnel)</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-zinc-700 flex items-center justify-center">
                                {cover ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={cover} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                ) : (
                                    <PhotoIcon className="h-5 w-5 text-gray-500" />
                                )}
                            </div>
                            <input
                                value={cover}
                                onChange={e => setCover(e.target.value)}
                                placeholder="URL de l'image (sinon, 1er item)"
                                className="flex-1 rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={e => onPickCover(e.target.files?.[0])} />
                            <button
                                type="button"
                                onClick={() => coverInput.current?.click()}
                                disabled={coverUploading}
                                className="shrink-0 rounded bg-zinc-700 px-2 py-2 text-xs font-semibold hover:bg-zinc-600 disabled:opacity-50"
                                title="Uploader une couverture"
                            >
                                {coverUploading ? '…' : <PhotoIcon className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 accent-amber-500" />
                        <span>Public <span className="text-gray-500">— visible par tous dans la liste du Duel</span></span>
                    </label>
                </div>

                {/* Items */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Items <span className="text-gray-500 font-normal text-sm">· {filledCount}</span></h2>
                </div>

                <div className="space-y-2">
                    {items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/40 p-2">
                            {/* Aperçu */}
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-zinc-700 flex items-center justify-center">
                                {it.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={it.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                ) : (
                                    <PhotoIcon className="h-5 w-5 text-gray-500" />
                                )}
                            </div>
                            {/* Nom + URL */}
                            <div className="flex-1 space-y-1">
                                <input
                                    value={it.name}
                                    onChange={e => setItem(idx, { name: e.target.value })}
                                    placeholder={`Item ${idx + 1}`}
                                    maxLength={60}
                                    className="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                                />
                                <input
                                    value={it.imageUrl}
                                    onChange={e => setItem(idx, { imageUrl: e.target.value })}
                                    placeholder="URL de l'image (optionnel)"
                                    className="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                />
                            </div>
                            {/* Upload */}
                            <input
                                ref={el => { fileInputs.current[idx] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => onPickFile(idx, e.target.files?.[0])}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputs.current[idx]?.click()}
                                disabled={it.uploading}
                                className="shrink-0 rounded bg-zinc-700 px-2 py-2 text-xs font-semibold hover:bg-zinc-600 disabled:opacity-50"
                                title="Uploader une image"
                            >
                                {it.uploading ? '…' : <PhotoIcon className="h-4 w-4" />}
                            </button>
                            {/* Supprimer la ligne */}
                            <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                disabled={items.length <= MIN_ITEMS}
                                className="shrink-0 rounded p-2 text-gray-400 hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                                title={items.length <= MIN_ITEMS ? `Minimum ${MIN_ITEMS} items` : 'Supprimer'}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addItem}
                    disabled={items.length >= MAX_ITEMS}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-40"
                >
                    <PlusIcon className="w-4 h-4" /> Ajouter un item
                </button>

                {error && <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-amber-500 px-4 py-3 font-bold text-white hover:bg-amber-400 disabled:opacity-50"
                    >
                        {saving ? 'Création…' : 'Créer'}
                    </button>
                    <Link href="/game/duel" className="rounded-lg border border-white/15 px-4 py-3 font-semibold text-gray-200 hover:bg-white/5">
                        Annuler
                    </Link>
                </div>
            </div>
        </div>
    );
}
