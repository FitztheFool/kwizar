"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateLobbyButton() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const disabled = loading || status === "loading" || !session?.user?.id;

    async function createLobby() {
        setLoading(true);
        try {
            const res = await fetch("/api/lobby/create", { method: "POST" });

            const text = await res.text(); // lis le body même si c'est pas du JSON

            if (!res.ok) {
                console.error("Create lobby failed:", res.status, text);
                throw new Error(`create lobby failed: ${res.status}`);
            }

            const data = JSON.parse(text);
            const { lobbyId } = data;
            router.push(`/lobby/${lobbyId}`)
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading") return null;

    // ✅ caché si pas connecté
    if (!session?.user?.id) return null;

    return (
        <button
            onClick={createLobby}
            disabled={disabled}
            className="border rounded px-4 py-2"
        >
            {loading ? "Création..." : "Créer un lobby"}
        </button>
    );
}
