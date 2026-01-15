import { io } from "socket.io-client";

// Connect to backend URL (adjust port if needed)
const URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
});

export default socket;
