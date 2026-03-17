// app/game/layout.tsx
export default function GameLayout({ children }) {
    return (
        <>
            {children}
            <PersistentChat />
        </>
    );
}
