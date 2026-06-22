'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PhotoIcon, ArrowUpTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Aligné sur /api/admin/games : chaque champ a sa valeur effective, son défaut, et un flag « custom ».
export interface AdminGame {
    key: string;
    gameType: string;
    mode: 'solo' | 'both' | 'multi';
    bot: boolean;
    enabled: boolean;

    label: string;
    defaultLabel: string;
    hasCustomLabel: boolean;

    image: string | null;
    defaultImage: string | null;
    hasCustomImage: boolean;

    cover: string | null;
    defaultCover: string | null;
    hasCustomCover: boolean;

    description: string;
    defaultDescription: string;
    hasCustomDescription: boolean;

    rules: string;
    defaultRules: string;
    hasCustomRules: boolean;

    score: string;
    defaultScore: string;
    hasCustomScore: boolean;

    players: string;
    defaultPlayers: string;
    hasCustomPlayers: boolean;

    scoreLabel: string;
    defaultScoreLabel: string;
    hasCustomScoreLabel: boolean;
}

// Upload une image via /api/upload → renvoie l'URL Cloudinary.
async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error((await res.json())?.error ?? "Échec de l'upload");
    return (await res.json()).url as string;
}

// Override à envoyer : null si vide ou identique au défaut (= pas de personnalisation), sinon la valeur.
const overrideOf = (value: string, def: string): string | null => {
    const v = value.trim();
    return v && v !== def.trim() ? v : null;
};

// Bloc image (icône ou couverture) : aperçu + upload + réinitialiser (null = défaut).
function ImageField({
    label, hint, aspect, value, fallback, disabled, onUpload, onReset,
}: {
    label: string;
    hint: string;
    aspect: string;
    value: string | null;
    fallback: string | null;
    disabled: boolean;
    onUpload: (file: File) => void;
    onReset: () => void;
}) {
    const effective = value ?? fallback;
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</label>
                {value && (
                    <button type="button" onClick={onReset} disabled={disabled}
                        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 disabled:opacity-50">
                        <ArrowPathIcon className="w-3 h-3" /> Réinitialiser
                    </button>
                )}
            </div>
            <label className={`relative group block ${aspect} w-full max-w-[220px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {effective ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={effective} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                    <span className="flex h-full w-full items-center justify-center"><PhotoIcon className="w-6 h-6 text-gray-400" /></span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                    <ArrowUpTrayIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                </span>
                <input type="file" accept="image/*" className="hidden" disabled={disabled}
                    onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
            </label>
            <p className="mt-1 text-[10px] text-gray-400">{hint}</p>
        </div>
    );
}

// Champ texte pré-rempli avec la valeur effective (éditable directement).
// « Réinitialiser » (visible si différent du défaut) remet le texte par défaut.
function Field({
    label, hint, value, defaultValue, onChange, multiline, rows,
}: {
    label: string;
    hint?: string;
    value: string;
    defaultValue: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    rows?: number;
}) {
    const cls = 'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400';
    const isCustom = value.trim() !== defaultValue.trim();
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</label>
                {isCustom && (
                    <button type="button" onClick={() => onChange(defaultValue)}
                        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500">
                        <ArrowPathIcon className="w-3 h-3" /> Réinitialiser
                    </button>
                )}
            </div>
            {multiline ? (
                <textarea value={value} rows={rows ?? 3} onChange={e => onChange(e.target.value)} className={`${cls} resize-y`} />
            ) : (
                <input type="text" value={value} onChange={e => onChange(e.target.value)} className={cls} />
            )}
            {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
        </div>
    );
}

export default function GameEditModal({
    game, onClose, onSaved,
}: {
    game: AdminGame;
    onClose: () => void;
    onSaved: () => void;
}) {
    // Champs texte : pré-remplis avec la valeur effective (override ?? défaut), éditables directement.
    const [label, setLabel] = useState(game.label);
    const [scoreLabel, setScoreLabel] = useState(game.scoreLabel);
    const [description, setDescription] = useState(game.description);
    const [rules, setRules] = useState(game.rules);
    const [score, setScore] = useState(game.score);
    // Images : override admin uniquement (null = repli sur le défaut config).
    const [imageUrl, setImageUrl] = useState<string | null>(game.hasCustomImage ? game.image : null);
    const [coverUrl, setCoverUrl] = useState<string | null>(game.hasCustomCover ? game.cover : null);
    const [enabled, setEnabled] = useState(game.enabled);

    const [uploading, setUploading] = useState<'image' | 'cover' | null>(null);
    const [saving, setSaving] = useState(false);

    const upload = useCallback(async (slot: 'image' | 'cover', file: File) => {
        setUploading(slot);
        try {
            const url = await uploadFile(file);
            if (slot === 'image') setImageUrl(url); else setCoverUrl(url);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Échec de l'upload");
        } finally {
            setUploading(null);
        }
    }, []);

    const patch = useCallback(async (body: Record<string, unknown>) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/games', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: game.key, ...body }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? 'Erreur');
            onSaved();
            onClose();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur réseau');
        } finally {
            setSaving(false);
        }
    }, [game.key, onSaved, onClose]);

    const save = useCallback(() => patch({
        enabled,
        label: overrideOf(label, game.defaultLabel),
        imageUrl,
        coverUrl,
        scoreLabel: overrideOf(scoreLabel, game.defaultScoreLabel),
        description: overrideOf(description, game.defaultDescription),
        rules: overrideOf(rules, game.defaultRules),
        score: overrideOf(score, game.defaultScore),
    }), [patch, enabled, label, imageUrl, coverUrl, scoreLabel, description, rules, score,
        game.defaultLabel, game.defaultScoreLabel, game.defaultDescription, game.defaultRules, game.defaultScore]);

    // Efface tous les overrides du jeu (retour aux défauts config) ; garde l'état activé.
    const resetAll = useCallback(() => {
        if (!confirm(`Réinitialiser « ${game.label} » à ses valeurs par défaut ?\nToutes les personnalisations (nom, images, textes…) seront perdues.`)) return;
        return patch({ label: null, imageUrl: null, coverUrl: null, description: null, rules: null, score: null, scoreLabel: null });
    }, [patch, game.label]);

    const busy = saving || uploading !== null;

    return (
        <Modal open onClose={onClose} title={`Modifier · ${game.label}`} className="max-w-2xl">
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
                {/* Nom + activation */}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Field label="Nom" value={label} defaultValue={game.defaultLabel} onChange={setLabel} />
                    </div>
                    <label className="flex cursor-pointer select-none items-center gap-2 pb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                        <input type="checkbox" checked={enabled} onChange={() => setEnabled(v => !v)}
                            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 accent-green-500" />
                        {enabled ? 'Activé' : 'Désactivé'}
                    </label>
                </div>

                {/* Joueurs (lecture seule, config) + indicateur bot, et libellé de score */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Joueurs</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={game.players}
                                disabled
                                className="flex-1 min-w-0 cursor-not-allowed rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                            />
                            <label className="flex shrink-0 cursor-not-allowed items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" title="Jeu jouable avec des bots">
                                <input type="checkbox" checked={game.bot} disabled
                                    className="h-4 w-4 cursor-not-allowed rounded border-gray-300 dark:border-gray-600 accent-gray-400" />
                                Bots
                            </label>
                        </div>
                    </div>
                    <Field label="Libellé du score (classement)" value={scoreLabel} defaultValue={game.defaultScoreLabel} onChange={setScoreLabel} />
                </div>

                {/* Images : icône + couverture */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ImageField label="Icône (carré)" hint="Affichée dans le lobby." aspect="aspect-square"
                        value={imageUrl} fallback={game.defaultImage} disabled={busy}
                        onUpload={f => upload('image', f)} onReset={() => setImageUrl(null)} />
                    <ImageField label="Couverture (paysage)" hint="Bannière sur l'accueil." aspect="aspect-video"
                        value={coverUrl} fallback={game.defaultCover} disabled={busy}
                        onUpload={f => upload('cover', f)} onReset={() => setCoverUrl(null)} />
                </div>

                <Field label="Description" value={description} defaultValue={game.defaultDescription}
                    onChange={setDescription} multiline rows={3} />
                <Field label="Règles" value={rules} defaultValue={game.defaultRules} hint="HTML autorisé (<p>, <ul>, <li>…)."
                    onChange={setRules} multiline rows={6} />
                <Field label="Calcul des points" value={score} defaultValue={game.defaultScore} hint="HTML autorisé."
                    onChange={setScore} multiline rows={3} />
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                <button type="button" onClick={resetAll} disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 disabled:opacity-50"
                    title="Effacer toutes les personnalisations et revenir à l'état initial">
                    <ArrowPathIcon className="w-4 h-4" /> Tout réinitialiser
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onClose} disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50">
                        Annuler
                    </button>
                    <button type="button" onClick={save} disabled={busy}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50">
                        {saving ? 'Enregistrement…' : uploading ? 'Upload…' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
