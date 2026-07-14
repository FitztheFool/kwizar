'use client';

import Link from 'next/link';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { GAME_CONFIG } from '@/lib/gameConfig';
import { GAME_THEME, gameThemeVars, type GameKey } from '@/lib/theme/games';
import { useGameAccent } from '@/hooks/useGameAccent';

interface Props {
    /**
     * Clé du jeu. **Obligatoire** : tout le thème en découle (couleur du titre, halo du
     * fond, lien vers le classement). Une prop optionnelle aurait laissé TypeScript muet
     * et la migration se serait arrêtée à mi-chemin.
     */
    game: GameKey;
    /** Titre affiché. À défaut, le label de GAME_CONFIG. */
    title?: string;
    /** Ornement décoratif de part et d'autre du titre (les `~~~` de Snake, etc.). */
    ornament?: string;
    maxWidthClass?: string;
}

/**
 * En-tête des jeux solo — Accueil · titre · Classement.
 *
 * Le titre était recopié dans chaque page avec sa couleur, sa fonte et son `textShadow`
 * en dur : 7 duplications, et des teintes qui divergeaient de la config (Tetris affichait
 * du violet alors que la config disait indigo). Ici, tout se déduit de `game`.
 *
 * Pose également `--halo-rgb` via useGameAccent : le halo du fond prend la couleur du jeu.
 *
 * Le lien de classement utilise la clé brute (`/leaderboard/flappy_bird`), pas `gameSlug`
 * — la route `[game]` attend la clé de GAME_CONFIG, pas sa version en kebab-case.
 */
export default function SoloGameHeader({ game, title, ornament, maxWidthClass = 'max-w-[440px]' }: Props) {
    useGameAccent(game);

    const label = title ?? GAME_CONFIG[game].label;
    const { hex } = GAME_THEME[game];

    const linkClass =
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-all';

    return (
        <div
            style={gameThemeVars(game)}
            className={`w-full ${maxWidthClass} flex items-center justify-between mb-5`}
        >
            <Link href="/" className={linkClass}>← Accueil</Link>

            <div className="flex items-center gap-2 select-none">
                {ornament && <span className="text-game/40 text-xs tracking-widest">{ornament}</span>}
                <span
                    className="font-arcade text-game text-base sm:text-lg uppercase"
                    // Le halo du titre : la seule chose qui brille au repos sur une page de
                    // jeu — c'est l'enseigne de la borne.
                    style={{ textShadow: `0 0 20px ${hex}80, 0 0 40px ${hex}33` }}
                >
                    {label}
                </span>
                {ornament && <span className="text-game/40 text-xs tracking-widest">{ornament}</span>}
            </div>

            <Link href={`/leaderboard/${game}`} className={linkClass}>
                <TrophyIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Classement</span>
            </Link>
        </div>
    );
}
