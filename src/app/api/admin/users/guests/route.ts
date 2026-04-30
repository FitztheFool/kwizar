import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function DELETE() {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { count } = await prisma.user.deleteMany({ where: { role: 'GUEST' } });
    return NextResponse.json({ deleted: count });
}
