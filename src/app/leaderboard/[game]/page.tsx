// src/app/leaderboard/[game]/page.tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LeaderboardView from '@/components/LeaderboardView';
import { GameType as Game, GAME_OPTIONS, GAME_CONFIG } from '@/lib/gameConfig';
import { buildMetadata } from '@/lib/seo';

const VALID_GAMES = GAME_OPTIONS.map(g => g.value);

type Props = {
    params: Promise<{ game: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { game } = await params;
    const label = GAME_CONFIG[game as keyof typeof GAME_CONFIG]?.label ?? 'Jeu';
    return buildMetadata({
        title: `Classement ${label}`,
        description: `Le classement des meilleurs joueurs de ${label} sur Kwizar.`,
        path: `/leaderboard/${game}`,
    });
}

export default async function LeaderboardPage({ params }: Props) {
    const { game } = await params;

    if (!VALID_GAMES.includes(game as Game)) {
        redirect('/leaderboard/uno');
    }

    return <LeaderboardView game={game as Game} />;
}
