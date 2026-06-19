import { NextResponse } from 'next/server';
import { getEnabledGameKeys } from '@/lib/gameSettings';

// Liste publique des clés de jeux activés (consommée par l'accueil et le lobby).
export async function GET() {
    const enabled = await getEnabledGameKeys();
    return NextResponse.json({ enabled: Array.from(enabled) });
}
