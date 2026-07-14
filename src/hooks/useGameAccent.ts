'use client';

import { useEffect } from 'react';
import { GAME_THEME, type GameKey } from '@/lib/theme/games';

/**
 * Applique la couleur signature d'un jeu au fond du document, le temps de la page.
 *
 * Pose `--halo-rgb` sur <html> : le halo de GridBackground est en `position: fixed`,
 * hors de l'arbre de la page — la cascade CSS ne peut donc pas l'atteindre depuis la
 * racine de page. D'où l'écriture directe sur l'élément racine. Résultat : le halo du
 * fond devient vert sur Snake, violet sur Tetris, sans une ligne par jeu.
 *
 * À ne pas confondre avec `useGameTheme()` (src/hooks/useGameTheme.ts), qui — malgré
 * son nom — détecte seulement si le thème sombre est actif, pour le rendu canvas.
 *
 * La variable `--game-rgb` (qui alimente `bg-game`, `text-game`, `shadow-game-glow`) est
 * posée en `style` sur la racine de la page via `gameThemeVars(key)` : là, la cascade
 * suffit. Ce hook ne s'occupe que de ce qui doit sortir de l'arbre.
 */
export function useGameAccent(game: GameKey): void {
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--halo-rgb', GAME_THEME[game].rgb.join(' '));

        // En quittant la page (accueil, classement…), le halo reprend l'accent de marque.
        // Accolades obligatoires : removeProperty renvoie une string, or un cleanup
        // d'useEffect doit renvoyer void.
        return () => {
            root.style.removeProperty('--halo-rgb');
        };
    }, [game]);
}
