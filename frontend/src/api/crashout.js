import { useState } from "react";
const [roundNumber, setRoundNumber] = useState(0);

export const handlePhaseChange = (payload) => {
  if (payload.phase === "Playing") {
    console.log("Game phase changed to Playing. Navigating to game page.");
  }
};
