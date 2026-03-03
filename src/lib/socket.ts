import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "", {
            transports: ["websocket"],
            withCredentials: true,
        });

        socket.on("connect", () => {
            console.log("✅ Socket connecté", socket?.id);
        });

        socket.on("connect_error", (err) => {
            console.error("❌ Socket error:", err);
        });
    }

    return socket;
}
