// Couleur signature de chaque jeu — SOURCE DE VÉRITÉ UNIQUE.
//
// Avant ce module, la couleur d'un jeu était écrite à 5 endroits qui se contredisaient
// (gameColor.ts disait `indigo` pour Tetris, la page affichait du violet ; Pac-Man était
// `yellow` en config mais son halo canvas était bleu). Ici, elle est écrite une fois.
//
// Pourquoi `hex` + `rgb` plutôt que des classes Tailwind : Tailwind ne peut pas générer
// de classe à partir d'une valeur runtime. Un `Record<GameKey, 'bg-green-500'>` est une
// impasse dès qu'on veut la même couleur dans un <canvas> (`ctx.fillStyle`) ou un
// `box-shadow`. Le couple hex/rgb est la seule représentation qui serve les 4
// consommateurs : classes Tailwind (via la variable CSS), styles inline, canvas, glows.
//
// Consommation :
//   <div style={gameThemeVars('snake')}>   → pose --game-rgb
//   className="bg-game text-game shadow-game-glow"  → une seule utilitaire, 34 jeux
//   ctx.fillStyle = GAME_THEME.snake.hex             → même couleur dans le canvas
import { GAME_CONFIG, GAME_KEY_BY_TYPE } from '@/lib/gameConfig';

/** Clé de jeu (34) — `Record<GameKey, …>` rend l'exhaustivité vérifiée par TypeScript. */
export type GameKey = keyof typeof GAME_CONFIG;

export interface GameTheme {
    /** Pour le canvas (`ctx.fillStyle`) et tout ce qui exige une couleur littérale. */
    hex: string;
    /** Triplet « R G B » pour composer des alphas : `rgb(var(--game-rgb) / 0.3)`. */
    rgb: readonly [number, number, number];
}

const t = (hex: string, r: number, g: number, b: number): GameTheme => ({
    hex,
    rgb: [r, g, b] as const,
});

/**
 * Couleur signature des 34 jeux.
 *
 * Arbitrage des désaccords historiques : **la couleur réellement vue en jeu gagne**,
 * puisque c'est celle que le joueur associe au jeu (Tetris → violet, pas indigo).
 */
export const GAME_THEME: Record<GameKey, GameTheme> = {
    // ── Solo (couleurs relevées dans les canvas / titres des pages) ──
    snake: t('#22c55e', 34, 197, 94), // green-500
    tetris: t('#c084fc', 192, 132, 252), // purple-400 — la page, pas l'indigo de l'ancienne config
    pacman: t('#facc15', 250, 204, 21), // yellow-400
    breakout: t('#22d3ee', 34, 211, 238), // cyan-400
    space_invaders: t('#10b981', 16, 185, 129), // emerald-500
    plumber: t('#f43f5e', 244, 63, 94), // rose-500
    flappy_bird: t('#eab308', 234, 179, 8), // yellow-500
    '2048': t('#edc22e', 237, 194, 46), // la tuile 2048 elle-même
    sutom: t('#f59e0b', 245, 158, 11), // amber-500
    match3: t('#e879f9', 232, 121, 249), // fuchsia-400
    demineur: t('#64748b', 100, 116, 139), // slate-500
    duel: t('#f59e0b', 245, 158, 11), // amber-500

    // ── Multijoueur ──
    uno: t('#ef4444', 239, 68, 68), // red-500
    skyjow: t('#0ea5e9', 14, 165, 233), // sky-500
    taboo: t('#ec4899', 236, 72, 153), // pink-500
    quiz: t('#10b981', 16, 185, 129), // emerald-500
    yahtzee: t('#f97316', 249, 115, 22), // orange-500
    puissance4: t('#f43f5e', 244, 63, 94), // rose-500
    just_one: t('#a855f7', 168, 85, 247), // purple-500
    battleship: t('#3b82f6', 59, 130, 246), // blue-500
    diamant: t('#f59e0b', 245, 158, 11), // amber-500
    ludo: t('#84cc16', 132, 204, 22), // lime-500
    perudo: t('#d946ef', 217, 70, 239), // fuchsia-500
    cant_stop: t('#d97706', 217, 119, 6), // amber-600
    mille_bornes: t('#6366f1', 99, 102, 241), // indigo-500
    atlantide: t('#06b6d4', 6, 182, 212), // cyan-500
    impostor: t('#8b5cf6', 139, 92, 246), // violet-500
    spyfall: t('#64748b', 100, 116, 139), // slate-500
    abalone: t('#78716c', 120, 113, 108), // stone-500
    blokus: t('#d946ef', 217, 70, 239), // fuchsia-500
    six_qui_prend: t('#f43f5e', 244, 63, 94), // rose-500
    complot: t('#b45309', 180, 83, 9), // amber-700
    tanks: t('#65a30d', 101, 163, 13), // lime-600
    dames: t('#a16207', 161, 98, 7), // yellow-700
};

/** Accent par mode de jeu — remplace les hex en dur de gameConfig (SOLO/BOTH/MULTI). */
export const MODE_THEME = {
    solo: t('#e11d48', 225, 29, 72), // rose-600
    both: t('#7c3aed', 124, 58, 237), // violet-600
    multi: t('#2563eb', 37, 99, 235), // blue-600
} as const;

/**
 * Variables CSS à poser sur la racine d'une page de jeu :
 * `<div style={gameThemeVars('snake')}>` → `bg-game`, `text-game`, `shadow-game-glow`
 * résolvent tous vers le vert de Snake, sans qu'aucune classe par jeu n'existe.
 */
export function gameThemeVars(key: GameKey): React.CSSProperties {
    const { rgb, hex } = GAME_THEME[key];
    return {
        '--game-rgb': rgb.join(' '),
        '--game-hex': hex,
    } as React.CSSProperties;
}

/** Couleur d'un jeu depuis sa valeur d'enum Prisma (GAME_2048 → 2048). */
export function gameThemeByType(gameType: string): GameTheme | undefined {
    const key = GAME_KEY_BY_TYPE[gameType] as GameKey | undefined;
    return key ? GAME_THEME[key] : undefined;
}
