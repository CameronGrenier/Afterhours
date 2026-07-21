import { useState } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import {CrashOutContext} from "./CrashOutContext";
// import { useToast } from "@/hooks/useToast"; // Uncomment if toasts are needed

export function CrashOutProvider({ children }) {
  // =========================================================================
  // Game State
  // =========================================================================
  const [gameState, setGameState] = useState("waiting"); // "waiting" | "running" | "crashed"
  const [multiplier, setMultiplier] = useState(1.00);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [gamePhase, setGamePhase] = useState("Waiting"); // "Waiting" | "Playing" | "Crashed"
  const [myBalance, setBalance] = useState(0); // Local user's balance
  const [myBet, setMyBet] = useState(null); // Local user's current bet
  const [roundBets, setRoundBets] = useState([]); // List of all bets in the active round

  // =========================================================================
  // Socket Event Listeners
  // =========================================================================


useSocketEvent("game_update", (data) => {
    console.log("Game Update: ", data.type, " payload: ", data.payload);
    if (data.type === "START_GAME") {
        console.log("Game start has been recieved", data.payload.starting_score)
        setBalance(data.payload.starting_score);
    }
    setGameState(data.payload.phase);
});


  // =========================================================================
  // Context Value
  // =========================================================================
  const value = {
    gameState,
    setGameState,
    multiplier,
    setMultiplier,
    hasCrashed,
    myBet,
    setMyBet,
    roundBets,
    setRoundBets,
    myBalance,
    setBalance,
  };

  return (
    <CrashOutContext.Provider value={value}>
      {children}
    </CrashOutContext.Provider>
  );
}