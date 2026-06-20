import { NextResponse } from 'next/server';
import { getGameImages } from '@/lib/gameSettings';

// Map publique clé de jeu → image effective (override admin ou défaut config).
export async function GET() {
    const images = await getGameImages();
    return NextResponse.json({ images });
}
