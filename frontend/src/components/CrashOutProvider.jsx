import { useState, useCallback, useEffect } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { usePartyContext } from "@/hooks/usePartyContext";
import {CrashOutContext} from "./CrashOutContext";
import { placeBet, crashOut } from "@/api/crashout";
// import { useToast } from "@/hooks/useToast"; // Uncomment if toasts are needed

export function CrashOutProvider({ children }) {
  // =========================================================================
  // Game State
  // =========================================================================
  const [gameState, setGameState] = useState("waiting"); // "waiting" | "running" | "crashed"
  const [betAmount, setBetAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [bettingDuration, setBettingDuration] = useState(0);
  const [progressBar, setProgressBar] = useState(100); // Progress bar percentage (0-100)
  const [bettingTimestamp, setBettingTimestamp] = useState(0); // Duration of the betting phase in seconds
  const [serverStartTime, setServerStartTime] = useState(null); // Server's start time for the current round
  const [countdown, setCountdown] = useState(0); // Countdown timer
  const [multiplierInterval, setMultiplierInterval] = useState(0); // Interval ID for updating the multiplier
  const [multiplierSeed, setMultiplierSeed] = useState([]); // Time at which the game will crash
  const [myBalance, setBalance] = useState(0); // Local user's balance
  const [myBet, setMyBet] = useState(null); // Local user's current bet
  const [roundBets, setRoundBets] = useState([]); // List of all bets in the active round
  const {serverTimeOffset} = usePartyContext(); 

  // =========================================================================
  // Socket Event Listeners
  // =========================================================================
function getServerTime() {
    return (Date.now() / 1000) + (serverTimeOffset || 0);
}

const getMultiplierAtTime = useCallback(() => {
  //console.log("Interval", multiplierInterval, "Seed", multiplierSeed, "Server Start Time", serverStartTime);
  const step_duration = multiplierInterval;
  const seed = multiplierSeed;
  //console.log("Server Time: ", getServerTime(), "Server Start Time: ", serverStartTime, "Offset: ", serverTimeOffset, "Time Now: ", Date.now() / 1000);
  const timeElapsed = Math.max(0, getServerTime() - serverStartTime);
  const index = Math.floor(timeElapsed / step_duration);

  if (index >= seed.length - 1) return 0;

  const startVal = seed[index];
  const endVal = seed[index + 1];
  const progress = (timeElapsed % step_duration) / step_duration;

  return startVal + (endVal - startVal) * progress;
}, [multiplierInterval, multiplierSeed, serverStartTime, serverTimeOffset]);

useEffect(() => {
  if (gameState !== "playing" || !serverStartTime) return;
      const interval = setInterval(() => {
        const now = getServerTime();
        let remaining = serverStartTime - now;
        setCountdown(remaining);
        setOverlayOpacity(Math.min(1, remaining));
        //console.log("Opactity: ", overlayOpacity, "remaining: ", remaining);
    }, 100);
  return () => clearInterval(interval);
}, [gameState, serverStartTime]);

useEffect(() => {
  if (gameState !== "betting") return;
      const interval = setInterval(() => {
        const now = getServerTime();
        let remaining = bettingTimestamp - now;
        setCountdown(remaining);
        const durationInMs = bettingDuration < 1000 ? bettingDuration * 1000 : bettingDuration;
        const percentage = Math.max(0, Math.min(100, (remaining / durationInMs) * 100000));
        //console.log("Progress Bar Percentage: ", percentage);
        setProgressBar(percentage);
    }, 100);
  return () => clearInterval(interval);
}, [gameState, serverStartTime, bettingTimestamp]);

useEffect(() => {
  if (gameState !== "blast_off" || !serverStartTime) return;
  const interval = setInterval(() => {
    const currentMultiplier = getMultiplierAtTime();
    //console.log("Current Multiplier: ", currentMultiplier);
    if (currentMultiplier <= 0) {
      setMultiplier(0);
      setHasCrashed(true);
      setGameState("crashed");
    } else {
      setMultiplier(currentMultiplier);
    }
  }, 50); // Updates 20 times/sec (change to 100 for 10 times/sec)

  // Clean up the timer when phase changes or component unmounts
  return () => clearInterval(interval);
}, [gameState, serverStartTime, getMultiplierAtTime]);

useSocketEvent("game_update", (data) => {
    console.log("Game Update: ", data.type, " payload: ", data.payload);
    if (data.type === "START_GAME") {
        console.log("Game start has been recieved", data.payload.starting_score)
        setBalance(data.payload.starting_score);
    }
    else if (data.type === "PHASE_CHANGE") {
      const phase = data.payload.phase
      setGameState(phase);
      if (phase === "betting") {
        setBetPlaced(false);
        setCashedOut(false);
        setProgressBar(100);
        setOverlayOpacity(1);
        setBettingDuration(data.payload.seconds);
        setBettingTimestamp(data.payload.timestamp);
      }
      else if (phase === "playing") {
        setServerStartTime(data.payload.start_time);
        setMultiplierInterval(data.payload.step_inverval);
        setMultiplierSeed(data.payload.seed);
      }
      else if (phase === "update_score") {
        //Logic for biggest loosers here.
      }
    }
    else if (data.type === "STOP_GAME") {
        console.log("Game is over");
    }
});

const handlePlaceBet = async () => {
  if (isSubmitting) return; // Prevent double clicks
  setIsSubmitting(true);

  try {
    // 1. Pass the actual bet amount variable from your state
    const res = await placeBet(betAmount);

    // 2. Handle the server's socket response
    if (res.status === "success") {
      //setPlayerState("ready"); // Player is in the game!
      console.log("Bet placed successfully:", res);
      setBalance(res.data.score); // Update balance with the new score from the server
      setBetPlaced(true);
    } else {
      console.error("Bet failed:", res.message);
      // Optional: Show error toast to user
    }
  } catch (err) {
    console.error("Failed to emit bet action:", err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleCrashOut = async () => {
  if (isSubmitting) return; // Prevent double clicks
  setIsSubmitting(true);

  try {
    // 1. Pass the actual bet amount variable from your state
    console.log("Multiplier at crash out: ", multiplier);
    const res = await crashOut(multiplier);

    // 2. Handle the server's socket response
    if (res.status === "success") {
      //setPlayerState("ready"); // Player is in the game!
      console.log("Crashed out successfully:", res);
      setCashedOut(true);
      setBalance(res.data.score); // Update balance with the new score from the server
    } else {
      console.error("Bet failed:", res.message);
      // Optional: Show error toast to user
    }
  } catch (err) {
    console.error("Failed to emit bet action:", err);
  } finally {
    setIsSubmitting(false);
  }
};


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
    countdown,
    setCountdown,
    bettingDuration,
    bettingTimestamp,
    progressBar,
    overlayOpacity,
    isSubmitting,
    setIsSubmitting,
    betAmount,
    setBetAmount,
    handlePlaceBet,
    handleCrashOut,
  };

  return (
    <CrashOutContext.Provider value={value}>
      {children}
    </CrashOutContext.Provider>
  );
}