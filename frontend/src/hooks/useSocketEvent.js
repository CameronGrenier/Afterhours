import { useEffect, useRef } from "react";
import { socket } from "@/api/client";

// reusable: subscribe to any event, auto-cleanup on unmount
export function useSocketEvent(event, handler) {
  // ref holds the latest handler without being a dependency
  const handlerRef = useRef(handler);

  // keep the ref current on every render (cheap, no resubscribe)
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    function listener(...args) {
      handlerRef.current(...args);
    }

    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]); // only re-subscribe if the event NAME changes
}