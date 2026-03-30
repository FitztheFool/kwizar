import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/lobby', '/game'];

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    if (
        token?.needsUsernameToken &&
        !pathname.startsWith('/auth/choose-username') &&
        !pathname.startsWith('/api/')
    ) {
        return NextResponse.redirect(
            new URL(`/auth/choose-username?token=${token.needsUsernameToken}`, req.url)
        );
    }

    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
    if (isProtected && !token) {
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
