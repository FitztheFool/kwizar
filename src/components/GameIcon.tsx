'use client';

import {
    RectangleStackIcon,
    Squares2X2Icon,
    ChatBubbleLeftRightIcon,
    QuestionMarkCircleIcon,
    CubeIcon,
    CircleStackIcon,
    LanguageIcon,
    ViewfinderCircleIcon,
    SparklesIcon,
    EyeSlashIcon,
    RectangleGroupIcon,
} from '@heroicons/react/24/outline';

const GAME_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    UNO:        RectangleStackIcon,
    SKYJOW:     Squares2X2Icon,
    TABOO:      ChatBubbleLeftRightIcon,
    QUIZ:       QuestionMarkCircleIcon,
    YAHTZEE:    CubeIcon,
    PUISSANCE4: CircleStackIcon,
    JUST_ONE:   LanguageIcon,
    BATTLESHIP: ViewfinderCircleIcon,
    DIAMANT:    SparklesIcon,
    IMPOSTOR:   EyeSlashIcon,
    // lowercase keys for gameConfig key-based lookups
    uno:        RectangleStackIcon,
    skyjow:     Squares2X2Icon,
    taboo:      ChatBubbleLeftRightIcon,
    quiz:       QuestionMarkCircleIcon,
    yahtzee:    CubeIcon,
    puissance4: CircleStackIcon,
    just_one:   LanguageIcon,
    battleship: ViewfinderCircleIcon,
    diamant:    SparklesIcon,
    impostor:   EyeSlashIcon,
};

interface Props {
    gameType: string;
    className?: string;
}

export default function GameIcon({ gameType, className = 'w-5 h-5' }: Props) {
    const Icon = GAME_ICON_MAP[gameType] ?? RectangleGroupIcon;
    return <Icon className={className} />;
}
