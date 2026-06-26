import { NextResponse } from 'next/server';
import { getTrendingGames } from '@/lib/appSettings';

// Liste publique (ordonnée) des clés de jeux en tendances pour le carrousel d'accueil.
export async function GET() {
    const games = await getTrendingGames();
    return NextResponse.json({ games });
}
