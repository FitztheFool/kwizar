'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond global — monté une fois dans le layout racine, fixé au viewport, derrière tout.
 *
 * Quatre couches empilées, **zéro state React** :
 *   1. halos d'ambiance   — deux blooms radiaux fixes, donnent la profondeur
 *   2. grille de points   — texture discrète (28px), pas une architecture
 *   3. halo au curseur    — deux lueurs interpolées qui suivent la souris
 *   4. grain              — bruit SVG, casse le côté « plat » des aplats
 *
 * La version précédente rendait jusqu'à ~1000 <div> et re-rendait tout le tableau à
 * chaque changement de case : d'où l'effet raide et blocky. Ici, le curseur n'écrit que
 * deux variables CSS (--mx / --my) via `style.setProperty` dans une boucle rAF. React ne
 * re-render jamais. Le navigateur ne fait que recomposer un gradient — sur GPU.
 *
 * Couleur : `--halo-rgb` suit l'accent de marque (bleu en clair, rouge en sombre), ou la
 * couleur du jeu quand `useGameAccent()` est monté sur une page de jeu.
 */

/** Inertie du halo : plus bas = plus traînant. C'est LE paramètre de « feeling ». */
const EASE_NEAR = 0.14;
/** Le halo large traîne davantage → effet de parallaxe, sensation de profondeur. */
const EASE_FAR = 0.06;

/** Bruit ~300 octets, en data: URI — aucune requête réseau, aucun souci de CSP. */
const NOISE_SVG =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function GridBackground() {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        // Mouvement réduit : pas de suivi du tout, on garde le fond statique.
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reduced.matches) return;

        // Cible = position réelle du curseur. Courant = position affichée, qui converge
        // vers la cible. C'est cet écart qui fait « lumière qui suit » plutôt que
        // « collée au curseur ».
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;
        let nearX = targetX, nearY = targetY;
        let farX = targetX, farY = targetY;

        let frame = 0;
        let moved = false;

        const onMove = (e: PointerEvent) => {
            targetX = e.clientX;
            targetY = e.clientY;
            moved = true;
        };

        const tick = () => {
            nearX += (targetX - nearX) * EASE_NEAR;
            nearY += (targetY - nearY) * EASE_NEAR;
            farX += (targetX - farX) * EASE_FAR;
            farY += (targetY - farY) * EASE_FAR;

            root.style.setProperty('--mx', `${nearX.toFixed(1)}px`);
            root.style.setProperty('--my', `${nearY.toFixed(1)}px`);
            root.style.setProperty('--fx', `${farX.toFixed(1)}px`);
            root.style.setProperty('--fy', `${farY.toFixed(1)}px`);

            frame = requestAnimationFrame(tick);
        };

        // Le halo ne se révèle qu'au premier mouvement : pas de lueur fantôme au chargement.
        // On pilote une variable CSS (et non une classe conditionnelle Tailwind) : un
        // sélecteur arbitraire type `[[data-active]_&]` n'était pas généré par Tailwind,
        // et les halos restaient invisibles.
        const start = () => {
            if (!moved) return;
            root.style.setProperty('--halo-on', '1');
            window.removeEventListener('pointermove', start);
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointermove', start, { passive: true });
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointermove', start);
        };
    }, []);

    return (
        <div
            ref={rootRef}
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            style={{ '--mx': '50vw', '--my': '40vh', '--fx': '50vw', '--fy': '40vh' } as React.CSSProperties}
        >
            {/* 1. Ambiance — deux blooms fixes. Donnent le relief avant toute interaction. */}
            <div
                className="absolute inset-0 opacity-70"
                style={{
                    backgroundImage: `
                        radial-gradient(60rem 60rem at 12% -12%, rgb(var(--accent) / 0.10), transparent 60%),
                        radial-gradient(50rem 50rem at 100% -5%, rgb(var(--accent) / 0.07), transparent 55%)
                    `,
                }}
            />

            {/* 2. Grille de points — texture, pas architecture. Estompée sur les bords
                   pour ne jamais concurrencer le contenu. */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at center, rgb(var(--halo-rgb) / 0.55) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                    opacity: 0.16,
                    maskImage:
                        'radial-gradient(ellipse 110% 95% at 50% 30%, black 35%, transparent 92%)',
                    WebkitMaskImage:
                        'radial-gradient(ellipse 110% 95% at 50% 30%, black 35%, transparent 92%)',
                }}
            />

            {/* 3a. Les points s'allument près du curseur — mêmes points, révélés par un
                    masque circulaire centré sur la souris. C'est l'effet « les cases
                    s'illuminent », mais sans un seul nœud DOM par case. */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at center, rgb(var(--halo-rgb) / 0.9) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                    maskImage:
                        'radial-gradient(200px circle at var(--mx) var(--my), black 0%, transparent 70%)',
                    WebkitMaskImage:
                        'radial-gradient(200px circle at var(--mx) var(--my), black 0%, transparent 70%)',
                    opacity: 'var(--halo-on, 0)',
                    transition: 'opacity 700ms ease-out',
                }}
            />

            {/* 3b. Lueur large et lente — la profondeur (parallaxe). */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(520px circle at var(--fx) var(--fy), rgb(var(--halo-rgb) / 0.07), transparent 65%)',
                    opacity: 'var(--halo-on, 0)',
                    transition: 'opacity 1000ms ease-out',
                }}
            />

            {/* 3c. Lueur proche et vive — le point chaud sous le curseur. */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(260px circle at var(--mx) var(--my), rgb(var(--halo-rgb) / 0.10), transparent 68%)',
                    opacity: 'var(--halo-on, 0)',
                    transition: 'opacity 500ms ease-out',
                }}
            />

            {/* 4. Grain — corrige le côté « plat » des dégradés lisses. */}
            <div
                className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] mix-blend-overlay"
                style={{ backgroundImage: NOISE_SVG, backgroundSize: '140px 140px' }}
            />
        </div>
    );
}
