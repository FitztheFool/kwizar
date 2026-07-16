import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/verificationToken';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    const { allowed, retryAfter } = await checkRateLimit(`reset:${getIp(req)}`, 5, 15 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Réessayez plus tard.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    const { token, password } = await req.json();

    if (!token || typeof token !== 'string' || !password) {
        return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 200) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }

    // Consomme le token (usage unique) avant d'écrire : en cas d'échec de la mise à
    // jour, le lien est brûlé et l'utilisateur en redemande un — fail-closed.
    const identifier = await consumeVerificationToken(token);
    if (!identifier) {
        return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.updateMany({
        where: { email: identifier },
        data: { passwordHash, status: 'ACTIVE' },
    });

    return NextResponse.json({ ok: true });
}
