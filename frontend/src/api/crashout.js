import { useState } from "react";
import { request, socket } from "./client";

export const handlePhaseChange = (payload) => {
  if (payload.phase === "Playing") {
    console.log("Game phase changed to Playing. Navigating to game page.");
  }
};

export const onSendAction = (event_type, payload) => {
  return new Promise((resolve) => {
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
  return await onSendAction("place_bet", { bet: amount });
};

export const crashOut = async (multiplier) => {
  const time = Date.now() / 1000;
  console.log("Given Multiplier: ", multiplier, "at time: ", time);
  return await onSendAction("cash_out", {
    cashout_time: time,
    multiplier: multiplier,
  });
};
