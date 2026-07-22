// Succès déblocables — SOURCE DE VÉRITÉ UNIQUE.
//
// v1 : entièrement DÉRIVÉS des stats déjà en base (Attempt, GameRating), évalués à la
// volée. Aucune migration, aucun moteur d'événements, rien à rétro-remplir — les joueurs
// existants voient immédiatement les succès que leur historique justifie. Une table de
// persistance (date de déblocage, notifications) pourra s'ajouter plus tard sans changer
// cette définition.
//
// Chaque succès expose une `progress(stats) → { current, target }` : la galerie affiche
// donc aussi les succès EN COURS avec une barre, pas seulement débloqué/verrouillé — ce
// qui est le vrai moteur d'engagement (« plus que 12 parties pour… »).

import type { GameType } from '@/generated/prisma/client';

/** Forme des stats consommées — sous-ensemble de ce que /api/user/[username]/stats renvoie. */
export interface AchievementStats {
    /** Total de parties jouées. */
    totalGames: number;
    /** Stats par type de jeu. Champs ELO optionnels (jeux non notés) → helpers en `?? 0`. */
    gameStats: Record<string, {
        count: number;
        wins: number;
        points: number;
        elo?: number | null;
        eloPeak?: number;
        bestScore: number;
    }>;
    /** Rang courant par jeu (1 = premier au classement), fourni par l'API. */
    ranks?: Record<string, number>;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface Achievement {
    id: string;
    label: string;
    description: string;
    tier: AchievementTier;
    /** Progression vers le déblocage. unlocked = current >= target. */
    progress: (s: AchievementStats) => { current: number; target: number };
}

// ── Helpers de dérivation ─────────────────────────────────────────────────────
const sumWins = (s: AchievementStats) =>
    Object.values(s.gameStats).reduce((n, g) => n + g.wins, 0);
const sumPoints = (s: AchievementStats) =>
    Object.values(s.gameStats).reduce((n, g) => n + g.points, 0);
const distinctGamesPlayed = (s: AchievementStats) =>
    Object.values(s.gameStats).filter(g => g.count > 0).length;
const bestElo = (s: AchievementStats) =>
    Object.values(s.gameStats).reduce((m, g) => Math.max(m, g.eloPeak ?? 0), 0);
const podiumCount = (s: AchievementStats) =>
    Object.values(s.ranks ?? {}).filter(r => r === 1).length;

/** Nombre total de jeux du catalogue — pour le succès « touche-à-tout ». */
export const TOTAL_GAME_COUNT = 36;

export const ACHIEVEMENTS: Achievement[] = [
    // ── Assiduité (nombre de parties) ──
    { id: 'games-1',   label: 'Première partie', description: 'Jouer 1 partie',   tier: 'bronze', progress: s => ({ current: s.totalGames, target: 1 }) },
    { id: 'games-10',  label: 'Premiers pas',    description: 'Jouer 10 parties', tier: 'bronze', progress: s => ({ current: s.totalGames, target: 10 }) },
    { id: 'games-100', label: 'Habitué',        description: 'Jouer 100 parties', tier: 'silver', progress: s => ({ current: s.totalGames, target: 100 }) },
    { id: 'games-500', label: 'Vétéran',        description: 'Jouer 500 parties', tier: 'gold',   progress: s => ({ current: s.totalGames, target: 500 }) },

    // ── Victoires ──
    { id: 'wins-1',   label: 'Première victoire', description: 'Gagner 1 partie', tier: 'bronze', progress: s => ({ current: sumWins(s), target: 1 }) },
    { id: 'wins-25',  label: 'Compétiteur',      description: 'Gagner 25 parties', tier: 'silver', progress: s => ({ current: sumWins(s), target: 25 }) },
    { id: 'wins-100', label: 'Champion',         description: 'Gagner 100 parties', tier: 'gold',   progress: s => ({ current: sumWins(s), target: 100 }) },

    // ── Variété ──
    { id: 'variety-5',   label: 'Curieux',      description: 'Jouer 5 jeux différents', tier: 'bronze', progress: s => ({ current: distinctGamesPlayed(s), target: 5 }) },
    { id: 'variety-15',  label: 'Éclectique',   description: 'Jouer 15 jeux différents', tier: 'silver', progress: s => ({ current: distinctGamesPlayed(s), target: 15 }) },
    { id: 'variety-all', label: 'Touche-à-tout',description: 'Jouer à tous les jeux', tier: 'gold',   progress: s => ({ current: distinctGamesPlayed(s), target: TOTAL_GAME_COUNT }) },

    // ── Classement (podium = #1 sur un jeu) ──
    { id: 'podium-1', label: 'Sur le podium', description: 'Être #1 sur un jeu', tier: 'silver', progress: s => ({ current: podiumCount(s), target: 1 }) },
    { id: 'podium-3', label: 'Multi-titré',   description: 'Être #1 sur 3 jeux', tier: 'gold',   progress: s => ({ current: podiumCount(s), target: 3 }) },

    // ── ELO ──
    { id: 'elo-1100', label: 'Aguerri',   description: 'Atteindre 1100 d’ELO', tier: 'silver', progress: s => ({ current: bestElo(s), target: 1100 }) },
    { id: 'elo-1300', label: 'Redoutable',description: 'Atteindre 1300 d’ELO', tier: 'gold',   progress: s => ({ current: bestElo(s), target: 1300 }) },

    // ── Score cumulé ──
    { id: 'points-10k',  label: 'Collectionneur', description: 'Cumuler 10 000 points', tier: 'silver', progress: s => ({ current: sumPoints(s), target: 10_000 }) },
    { id: 'points-100k', label: 'Amasseur',       description: 'Cumuler 100 000 points', tier: 'gold',   progress: s => ({ current: sumPoints(s), target: 100_000 }) },
];

export interface EvaluatedAchievement extends Achievement {
    current: number;
    target: number;
    unlocked: boolean;
    /** 0 → 1, borné. */
    ratio: number;
}

/** Évalue tous les succès pour un joueur. Débloqués d'abord, puis les plus proches. */
export function evaluateAchievements(stats: AchievementStats): EvaluatedAchievement[] {
    return ACHIEVEMENTS.map(a => {
        const { current, target } = a.progress(stats);
        const ratio = target > 0 ? Math.min(1, current / target) : 0;
        return { ...a, current, target, unlocked: current >= target, ratio };
    }).sort((x, y) => {
        // Débloqués en tête, puis par progression décroissante.
        if (x.unlocked !== y.unlocked) return x.unlocked ? -1 : 1;
        return y.ratio - x.ratio;
    });
}
