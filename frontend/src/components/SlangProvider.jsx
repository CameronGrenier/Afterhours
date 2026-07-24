import { useState, useCallback, useEffect, useRef } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { usePartyContext } from "@/hooks/usePartyContext";
import { SlangContext } from "./SlangContext";
import { useNavigate } from "react-router-dom";

/**
 * SlangProvider
 * 
 * Manages all Slang! game state and Socket.IO communication.
 * Listens for "game_update" events from the backend and updates UI accordingly.
 * 
 * Phases:
 * - "seating" → Players confirm ready
 * - "turn" → Active player submits word
 * - "drinking" → Player lost a life, 4-sec pause
 * - "blackout" → Game over
 */
export function SlangProvider({ children }) {
  const navigate = useNavigate();
  const { username, partyCode } = usePartyContext();

  // =========================================================================
  // GAME STATE
  // =========================================================================
  const [phase, setPhase] = useState("seating"); // "seating" | "turn" | "drinking" | "blackout"
  const [gameStarted, setGameStarted] = useState(false);
  
  // Full game state from backend (use this for debugging)
  const [gameState, setGameState] = useState({});

  // Player-specific state
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState({}); // { name: { fails, eliminated } }
  const [turnOrder, setTurnOrder] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  
  // Turn state
  const [requiredLetter, setRequiredLetter] = useState(null);
  const [previousWord, setPreviousWord] = useState(null);
  const [wordChain, setWordChain] = useState([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Vote state
  const [pendingWord, setPendingWord] = useState(null);
  const [voteCount, setVoteCount] = useState(0);
  const [votesNeeded, setVotesNeeded] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedPlayers, setVotedPlayers] = useState([]);
  
  // Drinking/End state
  const [lastEliminatedPlayer, setLastEliminatedPlayer] = useState(null);
  const [eliminationReason, setEliminationReason] = useState(null);
  const [standings, setStandings] = useState([]);
  
  // Refs for timer (don't recreate on every render)
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  // =========================================================================
  // SOCKET.IO LISTENERS
  // =========================================================================

  /**
   * Listen for "game_update" events from the backend.
   * SlangEngine broadcasts these with type and payload.
   */
  useSocketEvent("game_update", (data) => {
    console.log("[Slang] Received game_update:", data);
    
    const { type, payload } = data;

    if (type === "START_GAME") {
      // Game starting: initialize turn order, show seating screen
      setGameStarted(true);
      setTurnOrder(payload.turn_order);
      setPhase("seating");
      setTimeLeft(15);
      setConfirmed([]);
      console.log("[Slang] Game started. Turn order:", payload.turn_order);
    } 
    else if (type === "PHASE_CHANGE") {
      // Phase changed: update UI based on new phase
      const newPhase = payload.phase;
      console.log("[Slang] Phase changed to:", newPhase);

      // Store full payload for debugging
      setGameState(payload);

      if (newPhase === "seating") {
        // Seating phase: show confirmed players
        setPhase("seating");
        setConfirmed(payload.confirmed || []);
        console.log("[Slang] Seating phase. Confirmed:", payload.confirmed);
      } 
      else if (newPhase === "turn") {
        // Turn phase: active turn with word submission
        setPhase("turn");
        setCurrentPlayer(payload.currentPlayer);
        setRequiredLetter(payload.requiredLetter);
        setPreviousWord(payload.previousWord);
        setTurnNumber(payload.turnNumber);
        setTimeLeft(payload.timeLeft || 15);
        setWordChain(payload.chain || []);
        setVoteCount(0);
        setHasVoted(false);

        // Update player fails/lives
        if (payload.fails) {
          setPlayers((prev) => ({ ...prev, ...payload.fails }));
        }

        // Check if there's a pending vote
        if (payload.pendingWord) {
          setPendingWord(payload.pendingWord);
          setVoteCount(payload.voteCount || 0);
          setVotesNeeded(payload.votesNeeded || 0);
          setVotedPlayers(payload.votedPlayers || []);
        } else {
          setPendingWord(null);
        }

        console.log("[Slang] Turn phase. Current player:", payload.currentPlayer);
      } 
      else if (newPhase === "drinking") {
        // Drinking phase: player lost a life, show drinking screen
        setPhase("drinking");
        setLastEliminatedPlayer(payload.playerName);
        setEliminationReason(payload.reason);
        setTimeLeft(4); // Drinking pause duration
        console.log("[Slang] Drinking phase. Player:", payload.playerName, "Reason:", payload.reason);
      } 
      else if (newPhase === "blackout") {
        // Game over: show standings
        setPhase("blackout");
        setLastEliminatedPlayer(payload.eliminatedPlayer);
        setStandings(payload.standings || []);
        console.log("[Slang] Game over. Standings:", payload.standings);
      }
    } 
    else if (type === "END_GAME") {
      // Game ended
      setPhase("blackout");
      console.log("[Slang] Game ended");
    }
  });

  // =========================================================================
  // TIMERS
  // =========================================================================

  /**
   * Turn timer countdown (15 seconds for word submission)
   * Also counts down drinking phase (4 seconds)
   */
  useEffect(() => {
    if (phase !== "turn" && phase !== "drinking") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const startTime = Date.now();
    const duration = phase === "drinking" ? 4000 : 15000; // ms

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // =========================================================================
  // GAME ACTIONS (emit to backend via Socket.IO)
  // =========================================================================

  /**
   * Confirm ready (seating phase)
   * Emits: { event_type: "confirm_ready" }
   */
  const handleConfirmReady = useCallback(async () => {
    try {
      socketRef.current?.emit("game_action", {
        event_type: "confirm_ready",
        data: {},
      });
      console.log("[Slang] Confirmed ready");
    } catch (err) {
      console.error("[Slang] Error confirming ready:", err);
    }
  }, []);

  /**
   * Submit a word (turn phase)
   * Emits: { event_type: "submit_word", data: { word } }
   */
  const handleSubmitWord = useCallback(
    async (word) => {
      if (!word || isSubmitting) return;
      
      setIsSubmitting(true);
      try {
        socketRef.current?.emit("game_action", {
          event_type: "submit_word",
          data: { word: word.toLowerCase().trim() },
        });
        console.log("[Slang] Submitted word:", word);
      } catch (err) {
        console.error("[Slang] Error submitting word:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  /**
   * Vote bullshit (vote phase)
   * Emits: { event_type: "vote_bullshit" }
   */
  const handleVoteBullshit = useCallback(async () => {
    if (hasVoted) return;
    
    try {
      socketRef.current?.emit("game_action", {
        event_type: "vote_bullshit",
        data: {},
      });
      setHasVoted(true);
      console.log("[Slang] Voted bullshit");
    } catch (err) {
      console.error("[Slang] Error voting:", err);
    }
  }, [hasVoted]);

  /**
   * Return to lobby
   */
  const handleLeave = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/lobby");
  }, [navigate]);

  /**
   * Play again (from blackout screen)
   */
  const handlePlayAgain = useCallback(() => {
    navigate("/room");
  }, [navigate]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const value = {
    // State
    phase,
    gameStarted,
    gameState,
    currentPlayer,
    players,
    turnOrder,
    confirmed,
    requiredLetter,
    previousWord,
    wordChain,
    turnNumber,
    timeLeft,
    isSubmitting,
    pendingWord,
    voteCount,
    votesNeeded,
    hasVoted,
    votedPlayers,
    lastEliminatedPlayer,
    eliminationReason,
    standings,
    username,

    // Actions
    handleConfirmReady,
    handleSubmitWord,
    handleVoteBullshit,
    handleLeave,
    handlePlayAgain,
  };

  return (
    <SlangContext.Provider value={value}>
      {children}
    </SlangContext.Provider>
  );
}