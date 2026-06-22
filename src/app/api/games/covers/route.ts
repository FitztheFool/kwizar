import { NextResponse } from 'next/server';
import { getGameCovers } from '@/lib/gameSettings';

// Map publique clé de jeu → bannière paysage effective (override admin ou défaut public/covers/).
export async function GET() {
    const covers = await getGameCovers();
    return NextResponse.json({ covers });
}
