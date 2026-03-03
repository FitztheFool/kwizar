import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function makeCode(len = 8) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

export async function POST() {
    const session = await getServerSession(authOptions);

    // ✅ seulement connecté
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lobbyId = makeCode(); // ex: "K7P2QXLO"
    return NextResponse.json({ lobbyId }, { status: 200 });
}
