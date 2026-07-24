import { useSlangContext } from "@/hooks/useSlangContext";
import { Trophy, RotateCcw } from "lucide-react";

/**
 * BLACKOUT PHASE
 * 
 * Game over! Shows final standings.
 * Sorted by lives (least failures = winner).
 * Highlights the eliminated player.
 * 
 * CUSTOMIZATION TIPS:
 * - Title size: "text-5xl" is the main title
 * - Medal emoji: Change 🥇🥈🥉 for different medals
 * - Button styling: Change border-red-500, bg-red-500/10
 * - Winner highlight: Adjust "border-yellow-400" color
 * - Background: Add or modify gradients in the className
 */

export default function Blackout() {
  const { standings, lastEliminatedPlayer, handlePlayAgain } = useSlangContext();

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 min-h-screen bg-gradient-to-br from-black via-red-950 to-black">
      {/* Game Over Title */}
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-widest text-red-300">Game Over</p>
        <h1 className="text-5xl font-black uppercase text-white drop-shadow-lg">
          Final Standings
        </h1>
      </div>

      {/* Standings */}
      <div className="w-full max-w-md space-y-3">
        {standings.map((player, idx) => {
          const isEliminated = player.name === lastEliminatedPlayer;
          const isWinner = idx === 0;
          const medal = idx < 3 ? medals[idx] : "•";

          return (
            <div
              key={player.name}
              className={`
                flex items-center justify-between gap-3 p-4 border-2
                transition-all duration-300
                ${
                  isWinner
                    ? "border-yellow-400 bg-yellow-400/10"
                    : isEliminated
                      ? "border-red-500 bg-red-500/10 opacity-50"
                      : "border-white/20 bg-white/5"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{medal}</span>
                <div>
                  <p
                    className={`
                      font-bold uppercase text-sm
                      ${isWinner ? "text-yellow-300" : "text-white"}
                    `}
                  >
                    {player.name}
                  </p>
                  {isEliminated && (
                    <p className="text-xs text-red-400">Eliminated</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-white/50">Lives Lost</p>
                <p className="text-2xl font-black text-red-400">
                  {"❌".repeat(player.fails)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Play Again Button */}
      <button
        onClick={handlePlayAgain}
        className={`
          px-8 py-4 text-lg font-bold uppercase tracking-wider
          border-2 border-red-500 bg-red-500/10
          text-white
          hover:bg-red-500/20 transition-all duration-200
          active:scale-95
          flex items-center justify-center gap-2
          mt-8
        `}
      >
        <RotateCcw className="w-5 h-5" />
        Play Again
      </button>

      {/* Stats Summary */}
      <div className="text-center mt-8 p-6 border border-white/20 bg-white/5 max-w-md">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-2">
          Game Stats
        </p>
        <p className="text-white/80 text-sm">
          Winner: <span className="font-bold text-yellow-300">{standings[0]?.name}</span>
        </p>
      </div>
    </div>
  );
}