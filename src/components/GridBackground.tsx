'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fond de grille interactif global (style movix), monté une fois dans le layout racine.
 * Fixé au viewport, derrière tout le contenu. La case sous le curseur + ses 8 voisines
 * (arêtes ET diagonales) s'illuminent en rouge. Suivi via mousemove sur window → réagit
 * sur toutes les pages, même sous le contenu. On ne re-render que lorsque la case active
 * change (pas à chaque pixel) pour rester fluide.
 */

const CELL = 46; // px — taille d'une case

export default function GridBackground() {
    const [dims, setDims] = useState({ cols: 0, rows: 0 });
    const [active, setActive] = useState<number | null>(null);
    const activeRef = useRef<number | null>(null);
    const colsRef = useRef(0);

    // Nombre de colonnes/lignes d'après le viewport (recalculé au resize).
    useEffect(() => {
        const recalc = () => {
            const cols = Math.ceil(window.innerWidth / CELL);
            const rows = Math.ceil(window.innerHeight / CELL);
            colsRef.current = cols;
            setDims({ cols, rows });
        };
        recalc();
        window.addEventListener('resize', recalc);
        return () => window.removeEventListener('resize', recalc);
    }, []);

    // Suivi curseur global. setState uniquement quand la case change → pas de jank.
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const cols = colsRef.current;
            if (!cols) return;
            const c = Math.floor(e.clientX / CELL);
            const r = Math.floor(e.clientY / CELL);
            const idx = r * cols + c;
            if (idx !== activeRef.current) {
                activeRef.current = idx;
                setActive(idx);
            }
        };
        const onOut = (e: MouseEvent) => {
            if (!e.relatedTarget) { activeRef.current = null; setActive(null); }
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseout', onOut);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseout', onOut);
        };
    }, []);

    const { cols, rows } = dims;
    const total = cols * rows;

    // Diamant autour du curseur (distance de Manhattan ≤ RADIUS) → forme en losange, pas un carré.
    // Map index → distance : 0 = centre, plus loin = plus faible.
    const RADIUS = 2;
    const lit = new Map<number, number>();
    if (active != null && cols) {
        const r0 = Math.floor(active / cols);
        const c0 = active % cols;
        for (let dr = -RADIUS; dr <= RADIUS; dr++) {
            const room = RADIUS - Math.abs(dr);
            for (let dc = -room; dc <= room; dc++) {
                const r = r0 + dr, c = c0 + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    lit.set(r * cols + c, Math.abs(dr) + Math.abs(dc));
                }
            }
        }
    }

    if (!total) return null;

    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 grid [mask-image:radial-gradient(ellipse_120%_120%_at_50%_40%,black,transparent_92%)]"
            style={{
                gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                gridAutoRows: `${CELL}px`,
            }}
        >
            {Array.from({ length: total }, (_, i) => {
                const dist = lit.get(i); // undefined = éteinte, 0 = centre, 1..RADIUS = anneaux
                // Intensité décroissante avec la distance (fondu en losange).
                const t = dist == null ? 0 : 1 - dist / (RADIUS + 1);
                return (
                    <div
                        key={i}
                        className="border-r border-b border-primary-500/10 transition-[background-color,box-shadow] duration-300 ease-out"
                        style={
                            dist != null
                                ? {
                                      backgroundColor: `rgb(var(--accent) / ${(0.12 * t).toFixed(3)})`,
                                      boxShadow: `inset 0 0 ${Math.round(20 * t)}px rgb(var(--accent) / ${(0.28 * t).toFixed(3)})${dist === 0 ? ', 0 0 16px rgb(var(--accent) / 0.22)' : ''}`,
                                  }
                                : undefined
                        }
                    />
                );
            })}
        </div>
    );
}
