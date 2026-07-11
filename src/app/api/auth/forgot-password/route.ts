import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail';
import { issueVerificationToken } from '@/lib/verificationToken';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    const { allowed, retryAfter } = checkRateLimit(`forgot:${getIp(req)}`, 1, 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    const { login } = await req.json();
    if (!login) return NextResponse.json({ error: 'Email ou pseudo requis' }, { status: 400 });

    // Réponse identique que le compte existe ou non (évite l'énumération)
    const isEmail = login.includes('@');
    const user = await prisma.user.findFirst({
        where: isEmail ? { email: login } : { username: login },
        select: { id: true, email: true, status: true },
    });

    const email = user?.email;

    if (user && email && user.status !== 'BANNED') {
        // Purge les anciens tokens et n'en persiste que l'empreinte : le token en
        // clair ne quitte le serveur que par email.
        const token = await issueVerificationToken(email, 60 * 60 * 1000);

        await sendPasswordResetEmail(email, token).catch(err =>
            console.error('[forgot-password] sendPasswordResetEmail error:', err)
        );
    }

    return NextResponse.json({ ok: true });
}
