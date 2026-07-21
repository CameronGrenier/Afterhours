import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { usePartyContext } from "@/hooks/usePartyContext";
import { CrashOutContext } from "./CrashOutContext";
import { placeBet, crashOut } from "@/api/crashout";
import { useNavigate } from "react-router-dom";

export function CrashOutProvider({ children }) {
  // =========================================================================
  // Game State
  // =========================================================================
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("waiting");
  const [betAmount, setBetAmount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gain, setGain] = useState(0);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [bettingDuration, setBettingDuration] = useState(0);
  const [progressBar, setProgressBar] = useState(100);
  const [bettingTimestamp, setBettingTimestamp] = useState(0);
  const [serverStartTime, setServerStartTime] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [multiplierInterval, setMultiplierInterval] = useState(0);
  const [multiplierSeed, setMultiplierSeed] = useState([]);
  const [myBalance, setBalance] = useState(0);
  const [myBet, setMyBet] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  
  const { serverTimeOffset, warning } = usePartyContext(); 

  // Refs for stable calculation values inside continuous interval loops
  const serverTimeOffsetRef = useRef(serverTimeOffset);
  const multiplierIntervalRef = useRef(multiplierInterval);
  const multiplierSeedRef = useRef(multiplierSeed);
  const serverStartTimeRef = useRef(serverStartTime);

  useEffect(() => { serverTimeOffsetRef.current = serverTimeOffset; }, [serverTimeOffset]);
  useEffect(() => { multiplierIntervalRef.current = multiplierInterval; }, [multiplierInterval]);
  useEffect(() => { multiplierSeedRef.current = multiplierSeed; }, [multiplierSeed]);
  useEffect(() => { serverStartTimeRef.current = serverStartTime; }, [serverStartTime]);

  // =========================================================================
  // Helper Functions
  // =========================================================================
  const getServerTime = useCallback(() => {
    return (Date.now() / 1000) + (serverTimeOffsetRef.current || 0);
  }, []);

  const getMultiplierAtTime = useCallback(() => {
    const step_duration = multiplierIntervalRef.current;
    const seed = multiplierSeedRef.current;
    const startTime = serverStartTimeRef.current;

    if (!startTime || !step_duration || !seed || seed.length === 0) return 1.0;

    const timeElapsed = Math.max(0, getServerTime() - startTime);
    const index = Math.floor(timeElapsed / step_duration);

    if (index >= seed.length - 1) return 0;

    const startVal = seed[index];
    const endVal = seed[index + 1];
    const progress = (timeElapsed % step_duration) / step_duration;

    return startVal + (endVal - startVal) * progress;
  }, [getServerTime]);

  // =========================================================================
  // Timers & Loops
  // =========================================================================

  // 1. Countdown Loop (Phase: "playing")
  useEffect(() => {
    if (gameState !== "playing" || !serverStartTime) return;

    const interval = setInterval(() => {
      const now = getServerTime();
      const remaining = serverStartTime - now;
      setCountdown(remaining);
      setOverlayOpacity(Math.min(1, remaining));
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, serverStartTime, getServerTime]);

  // 2. Progress Bar Loop (Phase: "betting")
  useEffect(() => {
    if (gameState !== "betting" || !bettingTimestamp) return;

    const interval = setInterval(() => {
      const now = getServerTime();
      const remaining = bettingTimestamp - now;
      setCountdown(remaining);
      const durationInMs = bettingDuration < 1000 ? bettingDuration * 1000 : bettingDuration;
      const percentage = Math.max(0, Math.min(100, (remaining / durationInMs) * 100000));
      setProgressBar(percentage);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, bettingTimestamp, bettingDuration, getServerTime]);

  // 3. Multiplier Blast-Off Loop
  useEffect(() => {
    if (gameState !== "blast_off" || !serverStartTime) return;

    const interval = setInterval(() => {
      const currentMultiplier = getMultiplierAtTime();
      if (currentMultiplier <= 0) {
        setMultiplier(0);
        setHasCrashed(true);
        setGameState("crashed");
      } else {
        setMultiplier(currentMultiplier);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, serverStartTime, getMultiplierAtTime]);

  // =========================================================================
  // Socket Handlers
  // =========================================================================
  useSocketEvent("game_update", (data) => {
    console.log(data)
    if (data.type === "START_GAME") {
      setBalance(data.payload.starting_score);
    } else if (data.type === "PHASE_CHANGE") {
      const phase = data.payload.phase;
      setGameState(phase);
      if (phase === "betting") {
        console.log(data)
        setBetAmount(0);
        setCurrentRound(data.payload.current_round)
        console.log("Current round", currentRound)
        setHasCrashed(false);
        setBetPlaced(false);
        setCashedOut(false);
        setProgressBar(100);
        setOverlayOpacity(1);
        setBettingDuration(data.payload.seconds);
        setBettingTimestamp(data.payload.timestamp);
      } else if (phase === "playing") {
        setServerStartTime(data.payload.start_time);
        setMultiplierInterval(data.payload.step_inverval);
        setMultiplierSeed(data.payload.seed);
      }
    } else if (data.type === "END_GAME"){
      navigate("/room")
    }
  });

  // =========================================================================
  // User Actions
  // =========================================================================
  const handlePlaceBet = useCallback(async () => {
    if (isSubmitting || betAmount === 0) return;
    setIsSubmitting(true);

    try {
      const res = await placeBet(betAmount);
      if (res.status === "success") {
        setBalance(res.data.score);
        setBetPlaced(true);
      }
      else{
        warning(res.message)
      }
    } catch (err) {
      warning("Failed to place bet")
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, betAmount]);

  const handleCrashOut = useCallback(async () => {
    if (isSubmitting || betAmount === 0 || cashedOut) return;
    setIsSubmitting(true);

    try {
      const res = await crashOut(multiplier);
      console.log(res)
      if (res.status === "success") {
        setCashedOut(true);
        setBalance(res.data.score);
        setGain(res.data.multiplier);
      }
      else{
        warning(res.message)
      }
    } catch (err) {
      warning("Failed to cash out")
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, betAmount, cashedOut, multiplier]);

  // =========================================================================
  // Memoized Context Value (Prevents lag cascade)
  // =========================================================================
  const value = useMemo(() => ({
    gameState,
    setGameState,
    multiplier,
    setMultiplier,
    hasCrashed,
    myBet,
    setMyBet,
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
    betPlaced,
    cashedOut,
    gain,
    currentRound,
  }), [
    gameState,
    multiplier,
    hasCrashed,
    myBet,
    myBalance,
    countdown,
    bettingDuration,
    bettingTimestamp,
    progressBar,
    overlayOpacity,
    isSubmitting,
    betAmount,
    handlePlaceBet,
    handleCrashOut,
    betPlaced,
    cashedOut,
    gain,
    currentRound,
  ]);

  return (
    <CrashOutContext.Provider value={value}>
      {children}
    </CrashOutContext.Provider>
  );
}