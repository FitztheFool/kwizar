// Icônes SVG des succès — clé = `Achievement.id` (cf. src/lib/achievements.ts).
//
// Séparé de `achievements.ts` pour que la définition des succès reste sans dépendance
// React (elle est importée côté serveur par achievementSync). Les notifications
// persistent l'id du succès dans `Notification.icon` et résolvent via `achievementIcon`.

import type { ComponentType, SVGProps } from 'react';
import {
    AcademicCapIcon,
    BanknotesIcon,
    BoltIcon,
    BuildingLibraryIcon,
    ChartBarIcon,
    CubeIcon,
    GlobeAltIcon,
    MapIcon,
    PlayIcon,
    PuzzlePieceIcon,
    SparklesIcon,
    SwatchIcon,
    TrophyIcon,
    UserPlusIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/solid';

export type AchievementIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** Médaille — pas d'équivalent Heroicons. */
export function MedalIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M7.6 2h2.6L13 8.2a6.5 6.5 0 0 0-2.6.4L7.6 2Zm6.2 0h2.6l-2.9 6.7a6.5 6.5 0 0 0-1.6-.5L13.8 2Z" />
            <path d="M12 9.5a6.25 6.25 0 1 0 0 12.5 6.25 6.25 0 0 0 0-12.5Zm.55 2.72.83 1.7 1.87.28c.42.06.59.58.28.87l-1.35 1.32.32 1.86c.07.42-.37.74-.75.54l-1.67-.88-1.67.88c-.38.2-.82-.12-.75-.54l.32-1.86-1.35-1.32c-.3-.29-.14-.81.28-.87l1.87-.28.83-1.7a.49.49 0 0 1 .89 0Z" />
        </svg>
    );
}

/** Couronne — pas d'équivalent Heroicons. */
export function CrownIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M3 8.5a1.5 1.5 0 1 1 1.94 1.43l1.6 3.02 3.72-4.6a1.5 1.5 0 1 1 1.48 0l3.72 4.6 1.6-3.02A1.5 1.5 0 1 1 21 8.5a1.5 1.5 0 0 1-1.06 1.43l-1.5 6.32a1 1 0 0 1-.97.77H6.53a1 1 0 0 1-.97-.77l-1.5-6.32A1.5 1.5 0 0 1 3 8.5ZM6 19a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Z" />
        </svg>
    );
}

/** Gemme — « Collectionneur » (distinct de Swatch, utilisé pour la variété). */
export function GemIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M7.2 3h9.6a1 1 0 0 1 .82.43l3.2 4.6a1 1 0 0 1-.06 1.22l-8 9.4a1 1 0 0 1-1.52 0l-8-9.4a1 1 0 0 1-.06-1.22l3.2-4.6A1 1 0 0 1 7.2 3Zm.32 2L5.4 8h4.03l1.2-3H7.52Zm5.36 0 1.2 3h4.02l-2.1-3h-3.12ZM12 5.6 10.72 8h2.56L12 5.6ZM5.7 10l4.6 5.4L8.72 10H5.7Zm5.1 0 1.2 4.3 1.2-4.3h-2.4Zm4.48 0-1.58 5.4 4.6-5.4h-3.02Z" />
        </svg>
    );
}

const BY_ID: Record<string, AchievementIcon> = {
    'games-1': PlayIcon,
    'games-10': PuzzlePieceIcon,
    'games-100': CubeIcon,
    'games-500': BuildingLibraryIcon,
    'wins-1': SparklesIcon,
    'wins-25': MedalIcon,
    'wins-100': TrophyIcon,
    'variety-5': SwatchIcon,
    'variety-15': GlobeAltIcon,
    'variety-all': MapIcon,
    'podium-1': AcademicCapIcon,
    'podium-3': CrownIcon,
    'elo-1100': ChartBarIcon,
    'elo-1300': BoltIcon,
    'points-10k': GemIcon,
    'points-100k': BanknotesIcon,
};

/** Icône d'un succès. Repli sur le trophée pour tout id inconnu (succès ajouté plus tard). */
export function achievementIcon(id: string | null | undefined): AchievementIcon {
    return (id && BY_ID[id]) || TrophyIcon;
}

/**
 * Icône d'une notification, selon son type. Les succès résolvent par leur clé d'icône
 * (`icon` = id de succès) ; les autres types ont une icône fixe.
 */
export function notificationIcon(type: string, icon: string | null | undefined): AchievementIcon {
    switch (type) {
        case 'friend_request': return UserPlusIcon;
        case 'friend_accept': return CheckBadgeIcon;
        case 'achievement':
        default: return achievementIcon(icon);
    }
}
