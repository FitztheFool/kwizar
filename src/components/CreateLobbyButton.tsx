"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { randomLobbyId } from "@/lib/utils";

export default function CreateLobbyButton() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading" || !session?.user?.id) return null;

    return (
        <button
            onClick={() => router.push(`/lobby/${randomLobbyId()}`)}
            className="border rounded px-4 py-2"
        >
            Créer un lobby
        </button>
    );
}
