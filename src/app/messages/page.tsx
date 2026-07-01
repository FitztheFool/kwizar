import SocialView from '@/components/Social/SocialView';

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    return <SocialView initialPanel="messages" initialTab={tab} />;
}
