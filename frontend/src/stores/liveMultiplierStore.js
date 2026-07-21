import { useSyncExternalStore } from "react";

let liveMultiplier = 1;
const listeners = new Set();

export function getLiveMultiplier() {
  return liveMultiplier;
}

export function setLiveMultiplier(nextMultiplier) {
  if (Object.is(liveMultiplier, nextMultiplier)) return;
  liveMultiplier = nextMultiplier;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLiveMultiplier() {
  return useSyncExternalStore(subscribe, getLiveMultiplier, getLiveMultiplier);
}
