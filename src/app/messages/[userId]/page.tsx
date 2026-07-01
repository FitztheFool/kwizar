import SocialView from '@/components/Social/SocialView';

export default async function MessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <SocialView initialUserId={userId} />;
}
