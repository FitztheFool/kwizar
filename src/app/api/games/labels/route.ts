import { NextResponse } from 'next/server';
import { getGameLabels } from '@/lib/gameSettings';

// Map publique clé de jeu → nom effectif (override admin ou défaut config).
export async function GET() {
    const labels = await getGameLabels();
    return NextResponse.json({ labels });
}
