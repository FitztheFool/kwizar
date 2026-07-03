// src/app/user/[username]/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import UserProfilePage from '@/components/UserProfilePage';
import { getUserProfile } from '@/lib/userProfile';

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    if (!username) return null;

    const session = await auth();
    // Son propre profil → on renvoie vers /dashboard (côté serveur, sans flash).
    if (session?.user?.username === username) redirect('/dashboard');

    // Profil calculé côté serveur → fallback SWR (rendu immédiat).
    const initialProfile = await getUserProfile(username, session?.user?.id ?? null);
    return <UserProfilePage username={username} initialProfile={initialProfile ?? undefined} />;
}
