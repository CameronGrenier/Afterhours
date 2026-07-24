import { useSlangContext } from "@/hooks/useSlangContext";
import Seating from "./Seating";
import YourTurn from "./YourTurn";
import Waiting from "./Waiting";
import Drinking from "./Drinking";
import Blackout from "./Blackout";

/**
 * SlangGame
 * 
 * Main game component that routes to different screens based on game phase.
 * This is what gets rendered in SlangPage.jsx.
 * 
 * Phases:
 * - "seating" → Seating component
 * - "turn" → YourTurn component
 * - "drinking" → Drinking component
 * - "blackout" → Blackout component
 * 
 * If phase is "turn" but it's not your turn, shows Waiting component.
 */

export default function SlangGame() {
  const { phase, currentPlayer, username, gameStarted } = useSlangContext();

  if (!gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white/60">Loading game...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate screen based on phase
  if (phase === "seating") {
    return <Seating />;
  } else if (phase === "turn") {
    // If it's your turn, show YourTurn. Otherwise, show Waiting.
    const isYourTurn = currentPlayer === username;
    return isYourTurn ? <YourTurn /> : <Waiting />;
  } else if (phase === "drinking") {
    return <Drinking />;
  } else if (phase === "blackout") {
    return <Blackout />;
  }

  // Fallback (shouldn't happen)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-white/60">Unknown phase: {phase}</p>
      </div>
    </div>
  );
}