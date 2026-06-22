import { NextResponse } from 'next/server';
import { getGameImages } from '@/lib/gameSettings';

// Map publique clé de jeu → icône carrée effective (override admin ou défaut public/icons/).
export async function GET() {
    const images = await getGameImages();
    return NextResponse.json({ images });
}
