const BASE_URL = `http://${window.location.hostname}:8000`;
import { io } from "socket.io-client";

export const socket = io(BASE_URL);

export async function request(path, options = {}) {
  const { body, headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...headers },
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const getServerStatus = () => {
  request("/status", {
    method: "GET",
    body: JSON.stringify({}),
  });
};
