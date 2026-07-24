import { useSlangContext } from "@/hooks/useSlangContext";
import { Check } from "lucide-react";

/**
 * SEATING PHASE
 * 
 * Displays all players in the lobby.
 * Each player confirms they're ready.
 * Game starts when everyone confirms.
 * 
 * CUSTOMIZATION TIPS:
 * - Change text colors: Look for "text-white" class
 * - Change border style: Edit the "border" classes
 * - Change button appearance: Edit the button classes
 * - Add animations: Add Tailwind animation classes like "animate-pulse"
 */

export default function Seating() {
  const { handleConfirmReady, confirmed, turnOrder, username } = useSlangContext();
  
  const totalPlayers = turnOrder.length;
  const isConfirmed = confirmed.includes(username);

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 min-h-screen">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-4xl font-bold uppercase tracking-widest text-white mb-2">
          Get Ready!
        </h2>
        <p className="text-sm text-white/60">
          Waiting for all players to confirm
        </p>
      </div>

      {/* Player List */}
      <div className="w-full max-w-md space-y-3">
        {turnOrder.map((player) => {
          const playerConfirmed = confirmed.includes(player);
          return (
            <div
              key={player}
              className={`
                flex items-center justify-between gap-3 p-4 border-2
                transition-all duration-300
                ${
                  playerConfirmed
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/20 bg-white/5"
                }
                ${player === username ? "ring-2 ring-orange-500" : ""}
              `}
            >
              <div>
                <p className="font-bold text-white uppercase text-sm">
                  {player}
                </p>
                {player === username && (
                  <p className="text-xs text-orange-400">You</p>
                )}
              </div>
              {playerConfirmed && (
                <div className="flex items-center gap-1">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-green-400 font-bold">Ready</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="text-center">
        <p className="text-white/80 font-bold mb-2">
          {confirmed.length} / {totalPlayers} ready
        </p>
        <div className="w-48 h-2 bg-white/20 border border-white/40">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300"
            style={{ width: `${(confirmed.length / totalPlayers) * 100}%` }}
          />
        </div>
      </div>

      {/* Confirm Button */}
      {!isConfirmed ? (
        <button
          onClick={handleConfirmReady}
          className={`
            px-8 py-3 text-lg font-bold uppercase tracking-wider
            border-2 border-red-500 bg-red-500/10
            hover:bg-red-500/20 transition-all duration-200
            text-white active:scale-95
          `}
        >
          I'm Ready!
        </button>
      ) : (
        <div className="px-8 py-3 text-lg font-bold uppercase tracking-wider border-2 border-green-500 bg-green-500/10 text-green-400">
          ✓ Confirmed
        </div>
      )}

      {/* Debug Info (remove in production) */}
      <div className="mt-auto text-xs text-white/40 text-center max-w-md">
        <p>Debug: Phase = seating | {confirmed.length}/{totalPlayers} players ready</p>
      </div>
    </div>
  );
}