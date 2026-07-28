// Derive the API host from the page's own hostname so the browser treats API
// requests as same-site. Hardcoding 127.0.0.1 while the app is served from
// localhost makes requests cross-site, and the SameSite=lax `ah_session`
// cookie is then dropped on fetches — which breaks host verification
// (select_game silently fails, so the room never records the chosen game).
// In production VITE_API_URL is set and overrides this.
const API_HOST =
  typeof window !== "undefined" && window.location?.hostname
    ? window.location.hostname
    : "127.0.0.1";
const BASE_URL = import.meta.env.VITE_API_URL ?? `http://${API_HOST}:8000`;
import { io } from "socket.io-client";

console.log(
  "[client] BASE_URL=",
  BASE_URL,
  "| page.origin=",
  typeof window !== "undefined" ? window.location.origin : "(no window)",
  "| VITE_API_URL=",
  import.meta.env.VITE_API_URL ?? "(unset)",
);

export const socket = io(BASE_URL);

export async function request(path, options = {}) {
  const { body, headers, ...rest } = options;
  console.log(
    `[client] request -> ${path} | document.cookie=`,
    typeof document !== "undefined" ? document.cookie || "(empty/httponly)" : "(no document)",
  );
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  console.log(`[client] response <- ${path} | status=${res.status} | body=`, json);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return json;
}

export const getServerStatus = () => {
  request("/status", {
    method: "GET",
    body: JSON.stringify({}),
  });
};
