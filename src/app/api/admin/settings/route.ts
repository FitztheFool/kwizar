import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { FEATURE_KEYS, type FeatureKey, getFeatureFlags, setFeatureEnabled } from '@/lib/appSettings';

// État des drapeaux de fonctionnalités (admin uniquement).
export async function GET() {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    return NextResponse.json(await getFeatureFlags());
}

// Active/désactive une fonctionnalité.
export async function PATCH(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    let body: { key?: string; enabled?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
    }

    const { key, enabled } = body;
    if (typeof key !== 'string' || typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    if (!FEATURE_KEYS.includes(key as FeatureKey)) {
        return NextResponse.json({ error: 'Réglage inconnu' }, { status: 404 });
    }

    await setFeatureEnabled(key as FeatureKey, enabled);
    return NextResponse.json({ ok: true, key, enabled });
}
