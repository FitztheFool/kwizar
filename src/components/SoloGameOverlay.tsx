'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import type { Phase, SubmitState } from '@/hooks/useSoloGame';
import { CheckIcon } from '@heroicons/react/24/outline';
import { gameThemeVars, type GameKey } from '@/lib/theme/games';

interface SoloGameOverlayProps {
    /**
     * Clé du jeu. **Obligatoire** : remplace les 6 props `className` que chaque page
     * devait fournir (titleClassName, replayClassName, newBestClassName…) — autant de
     * duplications qui divergeaient d'une page à l'autre.
     */
    game: GameKey;
    phase: Phase;
    displayScore: number;
    displayLevel?: number;
    isNewBest: boolean;
    submitState: SubmitState;
    session: Session | null | undefined;
    onReplay: () => void;
    /** Titre optionnel (« GAME OVER », « Bravo ! »…). */
    title?: string;
    children?: React.ReactNode;
}

/**
 * Écran de fin de partie des jeux solo.
 *
 * Tout le thème se déduit de `game` : le titre et le bouton Rejouer prennent la couleur
 * du jeu, le record passe en `warning`, la confirmation de sauvegarde en `success`.
 * Le lien vers le classement se dérive aussi de la clé.
 */
export default function SoloGameOverlay({
    game,
    phase,
    displayScore,
    displayLevel,
    isNewBest,
    submitState,
    session,
    onReplay,
    title,
    children,
}: SoloGameOverlayProps) {
    if (phase !== 'over') return null;

    return (
        <div
            style={gameThemeVars(game)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 backdrop-blur-sm"
        >
            {title && <div className="text-2xl font-black text-game">{title}</div>}

            <div className="font-arcade text-2xl sm:text-3xl text-white">{displayScore}</div>
            <div className="text-xs uppercase tracking-widest text-white/40">points</div>

            {displayLevel !== undefined && (
                <div className="text-sm text-gray-400">Niveau atteint : {displayLevel}</div>
            )}

            {isNewBest && displayScore > 0 && (
                <div className="text-sm font-bold text-warning">Nouveau record !</div>
            )}

            {session?.user ? (
                <div className="text-xs text-gray-400 h-4">
                    {submitState === 'loading' && 'Sauvegarde…'}
                    {submitState === 'done' && (
                        <span>
                            <CheckIcon className="inline-block w-3.5 h-3.5 text-success align-text-bottom mr-1" />
                            Score sauvegardé
                        </span>
                    )}
                    {submitState === 'error' && <span className="text-danger">Erreur de sauvegarde</span>}
                </div>
            ) : displayScore > 0 ? (
                <div className="text-xs text-gray-400 h-4">
                    <Link href="/login" className="underline hover:text-gray-300">Connectez-vous</Link> pour sauvegarder
                </div>
            ) : (
                <div className="h-4" />
            )}

            {children}

            <div className="flex gap-3 mt-1">
                <button
                    onClick={onReplay}
                    className="px-5 py-2.5 rounded-xl bg-game text-black font-bold text-sm transition-all hover:brightness-110 hover:shadow-game-glow active:scale-95"
                >
                    Rejouer
                </button>
                <Link
                    href={`/leaderboard/${game}`}
                    className="px-5 py-2.5 rounded-xl glass text-white font-bold text-sm transition-all hover:bg-white/10"
                >
                    Classement
                </Link>
            </div>
        </div>
    );
}
