import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mail';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    const { allowed, retryAfter } = checkRateLimit(`resend-verify:${getIp(req)}`, 1, 3 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    const { identifier } = await req.json();
    if (!identifier) return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });

    const user = await prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] },
        select: { status: true, email: true },
    });

    if (!user || user.status !== 'PENDING' || !user.email) {
        return NextResponse.json({ ok: true });
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });

    const token = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
        data: {
            identifier: user.email,
            token,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });

    try {
        await sendVerificationEmail(user.email, token);
    } catch (err) {
        console.error('[resend-verification] Erreur envoi email:', err);
        return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
