import { useState } from "react";
import { request, socket } from "./client";

const [roundNumber, setRoundNumber] = useState(0);

export const handlePhaseChange = (payload) => {
  if (payload.phase === "Playing") {
    console.log("Game phase changed to Playing. Navigating to game page.");
  }
};

export const onSendAction = (event_type, payload) => {
  return new Promise((resolve, reject) => {
    socket.emit(
      "game_action",
      {
        event_type: event_type,
        data: payload,
      },
      (response) => {
        if (response && response.status === "success") {
          console.log("Server accepted action:", response);
          resolve(response);
        } else {
          const errMsg = response?.message || "Unknown error";
          console.error(`\n[Game Warning] Server rejected action: ${errMsg}`);
          resolve({
            status: "error",
            message: errMsg,
            data: {
              score: 0,
              bet: 0,
            },
          });
        }
      },
    );
  });
};

export const placeBet = async (amount) => {
  return request("/create_room", {
    method: "POST",
    body: { username, sid },
  });
};
