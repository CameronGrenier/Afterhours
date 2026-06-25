import { useEffect, useRef } from "react";
import { socket } from "@/api/client";

/**
 * Subscribe to a Socket.IO event for the lifetime of the calling component.
 *
 * The listener is registered once (per event name) and cleaned up automatically
 * on unmount, so there's no risk of duplicate handlers stacking up across
 * re-renders. The handler is kept fresh via a ref, which means you can pass an
 * inline arrow that reads current props/state without triggering a resubscribe
 * or hitting a stale closure.
 *
 * @param {string} event - The event name to listen for (e.g. "whoami", "connect").
 *   Changing this value resubscribes to the new event; keep it stable otherwise.
 * @param {(...args: any[]) => void} handler - Called whenever the event fires.
 *   Receives whatever arguments the server emitted. Safe to redefine each render.
 *
 * @example
 * // Log the socket id whenever the server sends it
 * useSocketEvent("whoami", (sid) => console.log("my sid:", sid));
 *
 * @example
 * // Handler can freely read current state — no stale closure
 * useSocketEvent("player_joined", (player) => {
 *   setPlayers((prev) => [...prev, player]);
 * });
 */
export function useSocketEvent(event, handler) {
  // ref holds the latest handler without being a dependency
  const handlerRef = useRef(handler);

  // keep the ref current on every render (cheap, no resubscribe)
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    // stable wrapper registered once per event name; always calls the latest handler
    function listener(...args) {
      handlerRef.current(...args);
    }

    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]); // only re-subscribe if the event NAME changes
}