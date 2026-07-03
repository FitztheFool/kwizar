// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import UserProfilePage from '@/components/UserProfilePage';
import { getUserProfile } from '@/lib/userProfile';

export default async function DashboardPage() {
    const session = await auth();
    // Route protégée par proxy.ts : la session est présente ici.
    if (!session?.user) return null;
    const username = session.user.username || session.user.id;

    // Profil calculé côté serveur → passé en fallback SWR (rendu immédiat, sans spinner).
    const initialProfile = await getUserProfile(username, session.user.id);
    return <UserProfilePage username={username} isOwnProfile initialProfile={initialProfile ?? undefined} />;
}
