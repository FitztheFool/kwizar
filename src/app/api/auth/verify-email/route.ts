import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/verificationToken';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    const { allowed, retryAfter } = checkRateLimit(`verify-email:${getIp(req)}`, 20, 15 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Réessayez plus tard.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    const { token } = await req.json();
    if (!token || typeof token !== 'string') return NextResponse.json({ error: 'Token manquant.' }, { status: 400 });

    const identifier = await consumeVerificationToken(token);
    if (!identifier) {
        return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 });
    }

    await prisma.user.updateMany({
        where: { email: identifier, status: 'PENDING' },
        data: { status: 'ACTIVE', isAnonymous: false, emailVerified: new Date() },
    });

    return NextResponse.json({ ok: true });
}
