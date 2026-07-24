import { useSlangContext } from "@/hooks/useSlangContext";

/**
 * DRINKING PHASE
 * 
 * Shown when a player loses a life.
 * 4-second pause screen showing:
 * - Who lost the life
 * - Why they lost (timeout, bullshit vote, invalid word)
 * - Their remaining lives
 * - Dramatic styling
 * 
 * CUSTOMIZATION TIPS:
 * - Background glow: Adjust "from-red-600 to-black" gradient
 * - Text size: "text-5xl" is the main title, adjust as needed
 * - Animation: Add "animate-pulse" or "animate-bounce" classes
 * - Countdown: Change "text-4xl" for size
 * - Color scheme: All reds/pinks, easy to swap
 */

export default function Drinking() {
  const { lastEliminatedPlayer, eliminationReason, timeLeft, players } = useSlangContext();

  const reasonText = {
    timeout: "⏰ Time's up!",
    bullshit_vote: "🚨 Bullshit vote!",
    invalid_word: "❌ Invalid word!",
  };

  const reasonMessage = {
    timeout: "Took too long to submit a word",
    bullshit_vote: "Word didn't pass the vote",
    invalid_word: "Word didn't start with the required letter",
  };

  const playerLives = players[lastEliminatedPlayer]?.fails || 0;
  const livesRemaining = 3 - playerLives;

  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-8 p-8 min-h-screen
        bg-gradient-to-br from-red-600 to-black
        animate-pulse
      `}
    >
      {/* Main Title */}
      <div className="text-center space-y-4">
        <p className="text-sm uppercase tracking-widest text-red-300">
          Oops!
        </p>
        <h1 className="text-5xl font-black uppercase text-white drop-shadow-lg">
          {lastEliminatedPlayer}
        </h1>
      </div>

      {/* Reason */}
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-red-300">
          {reasonText[eliminationReason] || "Lost a life"}
        </p>
        <p className="text-sm text-white/80">
          {reasonMessage[eliminationReason]}
        </p>
      </div>

      {/* Lives Counter */}
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-white/60">Lives remaining</p>
        <div className="text-6xl font-black">
          {livesRemaining > 0 ? (
            <span className="text-red-300">
              {"❌".repeat(playerLives)}
              {livesRemaining > 0 && "💙".repeat(livesRemaining)}
            </span>
          ) : (
            <span className="text-red-500">💀 ELIMINATED</span>
          )}
        </div>
        <p className="text-sm text-white/60">
          {livesRemaining > 0
            ? `${livesRemaining} ${livesRemaining === 1 ? "life" : "lives"} left`
            : "Out of the game"}
        </p>
      </div>

      {/* Countdown */}
      <div className="mt-8">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-3 text-center">
          Next round in
        </p>
        <div className="text-5xl font-black text-red-300 drop-shadow-lg">
          {timeLeft}
        </div>
      </div>

      {/* Dramatic Glow Effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(239,68,68,0.1) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}