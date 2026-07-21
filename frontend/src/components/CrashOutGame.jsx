import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, Rocket, RotateCcw } from "lucide-react";
import { usePartyContext } from "@/hooks/usePartyContext";
import { useCrashOutContext } from "@/hooks/useCrashoutContext";

const BET_OPTIONS = [10, 25, 50, 100, 250];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function PlayerState({ player }) {
  if (player.state === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">
        <Check size={14} strokeWidth={3} /> Ready · {money(player.bet)}
      </span>
    );
  }

  if (player.state === "cashed") {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-white">
        {player.cashout.toFixed(2)}× · {money(player.payout)}
      </span>
    );
  }

  return (
    <span className="text-xs font-medium uppercase tracking-wider text-white/45">
      Waiting for bet
    </span>
  );
}

export default function CrashOutDemo() {
  
  const { players: lobbyPlayers, username } = usePartyContext();
  const [balance, setBalance] = useState(1240);
  const [roundNumber, setRoundNumber] = useState(0);
  const {gameState, myBalance, multiplier, countdown, progressBar, overlayOpacity, isSubmitting, setIsSubmitting, betAmount, setBetAmount, handlePlaceBet, handleCrashOut, betPlaced, cashedOut} = useCrashOutContext();
  //Multiplier is from the server only gotta go
  const [roundRunning, setRoundRunning] = useState(false);
  const [playerState, setPlayerState] = useState("waiting");
  const [cashout, setCashout] = useState(null);
  const isWaitingToLaunch = gameState === "playing" || gameState === "betting";
  useEffect(() => {
    if (!roundRunning) return undefined;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - started) / 1000;
    }, 50);
    return () => window.clearInterval(timer);
  }, [roundRunning]);

  const players = useMemo(() => {
    const currentName = username || "You";
    const roster = lobbyPlayers.length
      ? Array.from(new Set([...lobbyPlayers, currentName]))
      : [currentName];

    return roster.map((name, index) => {
        const isYou = name === currentName;
        const player = {
          id: `${name}-${index}`,
          name,
          avatar: name.slice(0, 2).toUpperCase(),
          state: "waiting",
          isYou,
        };
        if (!isYou) return player;
        if (playerState === "ready") return { ...player, state: "ready", "bet": betAmount };
        if (playerState === "cashed") {
          return {
            ...player,
            state: "cashed",
            cashout: cashout.multiplier,
            payout: cashout.payout,
          };
        }
        return { ...player, state: "waiting" };
      });
  }, [ cashout, lobbyPlayers, playerState, username]);

  function changeBet(next) {
    if (playerState !== "waiting") return;
    setBetAmount(Math.max(10, Math.min(balance, next)));
  }

  function cashOut() {
    if (playerState !== "ready" || !roundRunning) return;
    const payout = Math.round(betAmount * multiplier);
    setBalance((current) => current + payout);
    setCashout({ multiplier, payout });
    setPlayerState("cashed");
    setRoundRunning(false);
  }

  function resetRound() {
    setPlayerState("waiting");
    setCashout(null);
    setRoundRunning(false);
  }

  const primaryLabel =
    gameState === "betting" && !betPlaced
      ? `Send bet · ${money(betAmount)}`
      : gameState === "betting" && betPlaced
        ? `Bet has been placed`
        : gameState === "blast_off"
          ? `Cash out · ${money(Math.round(multiplier * betAmount))}`
          : `Market is Closed`;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black font-sans text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,transparent_0,transparent_18%,#ff5b19_18.2%,transparent_18.5%),radial-gradient(circle_at_85%_30%,transparent_0,transparent_16%,#fff_16.2%,transparent_16.4%)]" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1600px] flex-col p-4 md:p-6">
        <header className="flex items-center justify-between border-b border-white/20 pb-4">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl uppercase tracking-tight md:text-3xl">Phase: </h1>
            <span className="hidden h-7 w-px bg-white/25 sm:block" />
            <span className="hidden text-sm font-semibold uppercase tracking-[0.2em] text-white/60 sm:block">{gameState}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
            <span>Round 04</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500 px-3 py-1 text-orange-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" /> {gameState}
            </span>
          </div>
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="order-2 border border-white/20 bg-black/85 lg:order-1">
            <div className="border-b border-white/20 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Your balance</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{money(myBalance)}</p>
            </div>
            <div className="p-3">
              <p className="px-2 pb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Players</p>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 border p-3 ${player.isYou ? "border-orange-500 bg-orange-500/10" : "border-white/10"}`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${player.state === "cashed" ? "bg-orange-500 text-black" : "border-2 border-white/50 bg-white/10"}`}>
                      {player.avatar}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold uppercase">{player.name}</span>
                      <PlayerState player={player} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
            <div className="relative min-h-[360px] flex-1 overflow-hidden border border-white/20 bg-[#090909] p-5 md:min-h-[480px] md:p-8">
  <div 
    className={`absolute inset-0 transition-all duration-500 ${
      gameState === "playing" 
        ? "blur-sm opacity-30 scale-[0.98] pointer-events-none" 
        : "blur-0 opacity-100 scale-100"
    }`}
  >
    <div className="absolute inset-x-0 bottom-[22%] h-px bg-white/20" />
    
    <div 
      className="absolute right-0 top-[65%] text-orange-500 transition-transform duration-300" 
      style={{ 
        transform: `translateY(${-Math.min(multiplier * 3, 28)}px) rotate(42deg)` 
      }}
    >
      <Rocket size={82} strokeWidth={1.5} fill="currentColor" className="text-orange-500" />
    </div>

    {/* Future canvas / line chart component goes here */}
  </div>
  {isWaitingToLaunch && (() => {
  const isBetting = gameState === "betting";
  const isLowTime = isBetting && countdown <= 3.0;

  // Configuration map for clean, readable dynamic styling
  const config = isBetting
    ? {
        badgeBorder: isLowTime ? "border-red-500/50" : "border-emerald-500/30",
        badgeBg: isLowTime ? "bg-red-500/20" : "bg-emerald-500/10",
        badgeText: isLowTime ? "text-red-400" : "text-emerald-400",
        dotColor: isLowTime ? "bg-red-500" : "bg-emerald-500",
        numberColor: isLowTime ? "text-red-400 animate-pulse" : "text-emerald-300",
        label: isLowTime ? "LAST CHANCE TO BET!" : "BETTING OPEN",
        subtext: "Place your wagers now",
        glow: isLowTime ? "shadow-red-500/20" : "shadow-emerald-500/10",
      }
    : {
        badgeBorder: "border-cyan-500/30",
        badgeBg: "bg-cyan-500/10",
        badgeText: "text-cyan-400",
        dotColor: "bg-cyan-400",
        numberColor: "text-white",
        label: "LAUNCH IMMINENT",
        subtext: "REFUELING & PREPPING ENGINES",
        glow: "shadow-cyan-500/10",
      };

  return (
    <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md transition-all duration-100 ${isBetting ? 'bg-black/50' : 'bg-slate-950/60'}`}
    style={{opacity: overlayOpacity}}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`flex items-center gap-2.5 rounded-full border ${config.badgeBorder} ${config.badgeBg} px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${config.badgeText} backdrop-blur-sm transition-colors duration-300`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75 ${isLowTime ? 'animate-ping' : 'animate-pulse'}`}></span>
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dotColor}`}></span>
          </span>
          {config.label}
        </div>
        <div className="flex items-baseline justify-center">
          <span className={`font-display text-[clamp(5rem,13vw,9rem)] font-black leading-none tracking-tight tabular-nums drop-shadow-2xl transition-colors duration-300 ${config.numberColor}`}>
            {gameState === "playing" ? `${countdown.toFixed(1)}s` : ""}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          {config.subtext}
        </p>
      </div>
    </div>
  );
})()}

  {/* ================================================================= */}
  {/* OVERLAY 2: ACTIVE GAME / CRASH DISPLAY (Active post-countdown)   */}
  {/* ================================================================= */}
  {gameState !== "playing" && (
    <div className="relative z-10 flex h-full min-h-[310px] flex-col items-center justify-center text-center">
      {/* Dynamic Status Header */}
      <p className={`mb-2 text-xs font-bold uppercase tracking-[0.3em] ${
        gameState === "crashed" || gameState === "update_score" 
          ? "text-red-500" 
          : "text-orange-500"
      }`}>
        {gameState === "blast_off" ? "Current Multiplier" : "Flight Ended"}
      </p>

      {/* Main Multiplier or Crash Status */}
      <p className={`font-display text-[clamp(5rem,14vw,12rem)] leading-none tracking-[-0.06em] tabular-nums transition-colors duration-300 ${
        gameState === "crashed" || gameState === "update_score" 
          ? "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.35)]" 
          : "text-white"
      }`}>
        {gameState === "blast_off" 
          ? `${multiplier.toFixed(2)}×` 
          : "CRASHED"}
      </p>

      {/* Subtext */}
      <p className="mt-4 max-w-md text-sm text-white/50">
        {gameState === "blast_off" 
          ? "" 
          : `Crashed @ ${multiplier.toFixed(2)}x`}
      </p>
    </div>
  )}
</div>

            <div className="grid gap-3 border border-white/20 bg-black p-3 md:grid-cols-[minmax(330px,0.85fr)_minmax(360px,1.15fr)]">
              <div className="flex flex-col gap-3 border border-white/15 p-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Your bet</p>
                    <p className="text-3xl font-bold tabular-nums">{money(betAmount)}</p>
                  </div>
                  <div className="flex">
                    <button aria-label="Decrease bet" disabled={playerState !== "waiting"} onClick={() => changeBet(betAmount - 10)} className="grid h-10 w-10 place-items-center border border-white/30 enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30"><Minus size={18} /></button>
                    <button aria-label="Increase bet" disabled={playerState !== "waiting"} onClick={() => changeBet(betAmount + 10)} className="grid h-10 w-10 place-items-center border-y border-r border-white/30 enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30"><Plus size={18} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {BET_OPTIONS.map((amount) => (
                    <button key={amount} disabled={playerState !== "waiting"} onClick={() => changeBet(amount)} className={`min-h-11 border text-sm font-bold tabular-nums transition ${betAmount === amount ? "border-orange-500 bg-orange-500 text-black" : "border-white/25 hover:border-white"} disabled:opacity-40`}>
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {playerState === "cashed" ? (
                <button 
                  onClick={resetRound} 
                  className="flex min-h-28 items-center justify-center gap-3 border-2 border-white bg-white px-6 text-xl font-bold uppercase tracking-wide text-black hover:bg-orange-500"
                >
                  <RotateCcw /> Next round
                </button>
              ) : (
                <button
                  onClick={gameState === "betting" ? handlePlaceBet : 
                    gameState === "blast_off" ? handleCrashOut : undefined}
                  className={`relative min-h-28 overflow-hidden border-2 text-[clamp(1.4rem,3vw,2.6rem)] font-bold uppercase tracking-tight transition active:scale-[0.99] ${
                    playerState === "ready"
                      ? "border-orange-500 bg-orange-500 text-black hover:bg-white"
                      : "border-white bg-neutral-950 text-white"
                  }`}
                >
                  {/* 1. Draining Background Bar (Betting Phase Only) */}
                  {gameState === "betting" && (
                    <div
                      className="absolute inset-y-0 left-0 bg-white transition-all duration-100 ease-linear"
                      style={{ width: `${progressBar}%` }}
                    />
                  )}

                  {/* 2. Text Layer with Inverted Contrast Trick */}
                  <span 
                    className={`relative z-10 ${
                      gameState === "betting" ? "mix-blend-difference text-white" : ""
                    }`}
                  >
                    {primaryLabel}
                  </span>
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
