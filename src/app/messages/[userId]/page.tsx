import MessagesPageView from '@/components/Messages/MessagesPageView';

export default async function MessageThreadPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <MessagesPageView initialUserId={userId} />;
}
