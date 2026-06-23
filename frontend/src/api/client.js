const BASE_URL = import.meta.env.VITE_API_URL; // Vite exposes env vars on import.meta.env
import { io } from "socket.io-client"

export const socket = io(BASE_URL, { autoConnect: false });

export async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const getServerStatus = () => {
  request("/status", {
    method: "GET",
    body: JSON.stringify({})
  });
}