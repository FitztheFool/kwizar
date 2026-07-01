import SocialView from '@/components/Social/SocialView';

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    return <SocialView initialPanel="friends" initialTab={tab} />;
}
