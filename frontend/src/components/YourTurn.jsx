import { useState, useRef, useEffect } from "react";
import { useSlangContext } from "@/hooks/useSlangContext";
import { AlertCircle, Send } from "lucide-react";

/**
 * YOUR TURN PHASE
 * 
 * Shows when it's the current player's turn to submit a word.
 * Displays:
 * - Required starting letter (large, prominent)
 * - Previous word in chain
 * - 15-second countdown timer
 * - Word input field
 * - Submit button
 * 
 * CUSTOMIZATION TIPS:
 * - Timer color: Change the gradient class (from-red-500 to-pink-500)
 * - Large letter size: Change "text-9xl" to "text-8xl" or "text-[120px]"
 * - Input field style: Edit border/bg classes in the input element
 * - Button colors: Change "border-red-500 bg-red-500/10"
 * - Background glow: Adjust the "shadow-lg" and gradient classes
 */

export default function YourTurn() {
  const {
    handleSubmitWord,
    isSubmitting,
    currentPlayer,
    username,
    requiredLetter,
    previousWord,
    timeLeft,
    players,
  } = useSlangContext();

  const [wordInput, setWordInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const isYourTurn = currentPlayer === username;

  // Auto-focus input when it's your turn
  useEffect(() => {
    if (isYourTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isYourTurn]);

  const handleSubmit = () => {
    if (!wordInput.trim()) {
      setError("Word can't be empty");
      return;
    }
    if (wordInput.trim().length < 3) {
      setError("Word must be 3+ letters");
      return;
    }
    setError("");
    handleSubmitWord(wordInput);
    setWordInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isSubmitting && isYourTurn) {
      handleSubmit();
    }
  };

  // Timer color based on time remaining
  const getTimerColor = () => {
    if (timeLeft <= 3) return "from-red-600 to-red-500";
    if (timeLeft <= 7) return "from-orange-500 to-red-500";
    return "from-yellow-500 to-orange-500";
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-screen">
      {/* Current Player Indicator */}
      <div className="text-center mb-4">
        <p className="text-sm text-white/60 uppercase tracking-widest">
          {isYourTurn ? "YOUR TURN" : `${currentPlayer}'s Turn`}
        </p>
      </div>

      {/* Required Letter (HUGE) */}
      <div className="mb-4">
        <p className="text-xs text-white/60 uppercase tracking-widest mb-2">
          Word must start with:
        </p>
        <div
          className={`
            text-9xl font-black uppercase
            text-transparent bg-clip-text
            bg-gradient-to-r from-red-500 via-pink-500 to-red-500
            drop-shadow-lg
            select-none
          `}
        >
          {requiredLetter?.toUpperCase()}
        </div>
      </div>

      {/* Previous Word */}
      {previousWord && (
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
            Previous word
          </p>
          <div className="text-2xl font-bold text-white/80 border-l-4 border-pink-500 pl-3">
            "{previousWord}"
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="my-6">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3 text-center">
          Time remaining
        </p>
        <div
          className={`
            w-48 h-24 rounded-lg
            bg-gradient-to-br ${getTimerColor()}
            flex items-center justify-center
            border-2 border-white/20
            shadow-xl
            ${timeLeft <= 3 ? "animate-pulse" : ""}
          `}
        >
          <span className="text-6xl font-black text-white">{timeLeft}</span>
        </div>
      </div>

      {/* Word Input */}
      {isYourTurn ? (
        <div className="w-full max-w-sm space-y-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your word..."
            value={wordInput}
            onChange={(e) => {
              setWordInput(e.target.value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            disabled={isSubmitting}
            className={`
              w-full px-4 py-3 text-lg font-bold uppercase
              border-2 bg-white/5
              text-white placeholder-white/40
              transition-all duration-200
              disabled:opacity-50
              ${error ? "border-red-500" : "border-white/30 focus:border-red-500"}
              focus:outline-none focus:bg-white/10
            `}
            maxLength={20}
          />
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !wordInput.trim()}
            className={`
              w-full px-4 py-3 text-lg font-bold uppercase tracking-wider
              border-2 flex items-center justify-center gap-2
              transition-all duration-200
              ${
                isSubmitting || !wordInput.trim()
                  ? "border-white/20 text-white/40 bg-white/5 cursor-not-allowed"
                  : "border-red-500 bg-red-500/10 text-white hover:bg-red-500/20 active:scale-95"
              }
            `}
          >
            <Send className="w-5 h-5" />
            Submit Word
          </button>
        </div>
      ) : (
        // Not your turn
        <div className="text-center p-6 border-2 border-white/20 bg-white/5 rounded-lg max-w-sm">
          <p className="text-white/80 uppercase font-bold tracking-widest mb-2">
            Waiting for {currentPlayer}...
          </p>
          <p className="text-xs text-white/40">
            They have {timeLeft} seconds to submit a word
          </p>
        </div>
      )}

      {/* Players Status (sidebar) */}
      <div className="mt-auto w-full max-w-sm">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Players</p>
        <div className="space-y-2">
          {Object.entries(players).map(([name, data]) => (
            <div
              key={name}
              className={`
                flex items-center justify-between px-3 py-2 text-sm border
                ${name === username ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"}
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

      {/* Debug Info */}
      <div className="mt-4 text-xs text-white/40 text-center">
        <p>Debug: Your turn = {isYourTurn.toString()} | Time = {timeLeft}s</p>
      </div>
    </div>
  );
}