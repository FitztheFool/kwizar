import LoadingSpinner from '@/components/LoadingSpinner';

// Root route-transition fallback (App Router).
export default function Loading() {
    return (
        <div className="flex-1 flex items-center justify-center py-20">
            <LoadingSpinner fullScreen={false} message="Chargement..." />
        </div>
    );
}
