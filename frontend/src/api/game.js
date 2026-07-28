import { request } from "./client";

export const selectGame = (code, gameId, sid) => {
  return request("/select_game", {
    method: "POST",
    body: { code, game_id: gameId, sid },
  });
};

export const startGame = (code, sid) => {
  return request("/start_game", {
    method: "POST",
    body: { code, sid },
  });
};

export const sendGameEvent = (code, username, eventType, data = {}) => {
  return request("/game_event", {
    method: "POST",
    body: { username, code, event_type: eventType, data },
  });
};
