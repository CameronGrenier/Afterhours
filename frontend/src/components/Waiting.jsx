import { useSlangContext } from "@/hooks/useSlangContext";
import { ThumbsDown, Check } from "lucide-react";

/**
 * WAITING PHASE
 * 
 * Shown when it's another player's turn.
 * If a word is disputed (not in word bank), shows a VOTE screen.
 * 
 * Shows:
 * - Current player's name
 * - Required starting letter
 * - If no vote: "Waiting for word..." counter
 * - If vote active: "BULLSHIT VOTE" with vote button
 * - Vote progress: "X / Y votes needed"
 * - Word chain so far
 * - Player status
 * 
 * CUSTOMIZATION TIPS:
 * - Vote button color: Change "bg-red-500/20 border-red-500"
 * - Vote progress bar: Change gradient colors
 * - Title styling: Adjust "text-4xl" size
 * - Font sizes: All are "text-xs" to "text-2xl", easy to adjust
 */

export default function Waiting() {
  const {
    currentPlayer,
    username,
    requiredLetter,
    timeLeft,
    pendingWord,
    voteCount,
    votesNeeded,
    hasVoted,
    wordChain,
    players,
    handleVoteBullshit,
  } = useSlangContext();

  const isVoteActive = pendingWord !== null;

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-screen">
      {/* Current Player */}
      <div className="text-center mb-2">
        <p className="text-sm text-white/60 uppercase tracking-widest mb-2">
          Current turn
        </p>
        <h2 className="text-4xl font-black uppercase text-white">
          {currentPlayer}
        </h2>
      </div>

      {/* Required Letter */}
      <div className="text-center">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
          They must start with:
        </p>
        <div
          className={`
            text-7xl font-black uppercase
            text-transparent bg-clip-text
            bg-gradient-to-r from-red-500 via-pink-500 to-red-500
            select-none
          `}
        >
          {requiredLetter?.toUpperCase()}
        </div>
      </div>

      {/* Vote Section OR Waiting Section */}
      {isVoteActive ? (
        // ===== VOTE ACTIVE =====
        <div className="w-full max-w-md space-y-6 mt-8">
          {/* Vote Title */}
          <div className="text-center p-6 bg-red-500/10 border-2 border-red-500">
            <p className="text-xl font-black uppercase text-red-400 tracking-widest">
              🚨 BULLSHIT VOTE 🚨
            </p>
            <p className="text-sm text-white/80 mt-2">
              Is "{pendingWord}" a real word?
            </p>
          </div>

          {/* Vote Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>Votes needed</span>
              <span className="font-bold text-white">
                {voteCount} / {votesNeeded}
              </span>
            </div>
            <div className="w-full h-4 bg-white/20 border border-white/40">
              <div
                className={`
                  h-full bg-gradient-to-r from-red-500 to-pink-500
                  transition-all duration-300
                `}
                style={{ width: `${(voteCount / votesNeeded) * 100}%` }}
              />
            </div>
          </div>

          {/* Vote Button */}
          {!hasVoted ? (
            <button
              onClick={handleVoteBullshit}
              className={`
                w-full px-6 py-4 text-lg font-bold uppercase tracking-wider
                border-2 border-red-500 bg-red-500/20
                text-white
                hover:bg-red-500/30 transition-all duration-200
                active:scale-95
                flex items-center justify-center gap-3
              `}
            >
              <ThumbsDown className="w-6 h-6" />
              Vote Bullshit!
            </button>
          ) : (
            <div className="w-full px-6 py-4 text-lg font-bold uppercase tracking-wider border-2 border-green-500 bg-green-500/20 text-green-400 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              You Voted
            </div>
          )}
        </div>
      ) : (
        // ===== NO VOTE - WAITING FOR WORD =====
        <div className="w-full max-w-md space-y-6 mt-8">
          <div className="text-center p-6 border-2 border-white/20 bg-white/5">
            <p className="text-white/80 uppercase font-bold tracking-widest mb-2">
              Waiting for {currentPlayer} to submit a word
            </p>
            <p className="text-3xl font-black text-white/60">{timeLeft}s</p>
          </div>
        </div>
      )}

      {/* Word Chain */}
      <div className="w-full max-w-md mt-8">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">
          Word chain ({wordChain.length})
        </p>
        {wordChain.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {wordChain.map((word, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-white/10 border border-white/20 text-white/80 text-sm font-bold rounded"
              >
                {word}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm">No words yet...</p>
        )}
      </div>

      {/* Players Status */}
      <div className="w-full max-w-md mt-8">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
          Player status
        </p>
        <div className="space-y-2">
          {Object.entries(players).map(([name, data]) => (
            <div
              key={name}
              className={`
                flex items-center justify-between px-3 py-2 text-sm border
                ${
                  name === currentPlayer
                    ? "border-red-500 bg-red-500/10"
                    : name === username
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-white/10 bg-white/5"
                }
              `}
            >
              <span className="font-bold text-white">{name}</span>
              <span className="text-white/60">
                {"❌".repeat(data.fails)} ({3 - data.fails} lives)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Debug */}
      <div className="mt-auto text-xs text-white/40 text-center">
        <p>
          Debug: Vote active = {isVoteActive.toString()} | Votes = {voteCount}/{votesNeeded}
        </p>
      </div>
    </div>
  );
}