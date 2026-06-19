import { NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/appSettings';

// Lecture publique : permet au client de masquer les fonctions désactivées.
export async function GET() {
    try {
        return NextResponse.json(await getFeatureFlags());
    } catch {
        // En cas d'erreur, on n'empêche rien (tout activé).
        return NextResponse.json({ friends: true, messages: true, sidebarSearch: true });
    }
}
