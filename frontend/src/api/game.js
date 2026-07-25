import { request } from "./client";

export const selectGame = (code, gameId) => {
  return request("/select_game", {
    method: "POST",
    body: { code, game_id: gameId },
  });
};

export const startGame = (code) => {
  return request("/start_game", {
    method: "POST",
    body: { code },
  });
};

export const sendGameEvent = (code, username, eventType, data = {}) => {
  return request("/game_event", {
    method: "POST",
    body: { username, code, event_type: eventType, data },
  });
};
