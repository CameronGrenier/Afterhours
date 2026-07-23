import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, Rocket, RotateCcw } from "lucide-react";
import RocketMultiplierGraph from "./RocketMultiplierGraph";
import { usePartyContext } from "@/hooks/usePartyContext";
import { useCrashOutContext } from "@/hooks/useCrashoutContext";
import { useNavigate } from "react-router-dom";

const BET_OPTIONS = [10, 25, 50, 100];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function PlayerState({ player }) {
  if (player.state === "cashed_out") {
    return (
      <span className="flex flex-col text-xs font-bold uppercase tracking-wider text-white leading-none gap-0.5">
        <span>Cashed out </span>
        <span>@ {player.multiplier.toFixed(2)}x</span>
      </span>
    );
  }

  if (player.state === "bet_placed") {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
        Bet: {money(player.bet)}
      </span>
    );
  }
  if (player.state === "crashed") {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-red-200">
        CRASHED OUT
      </span>
    );
  }

    if (player.state === "no_bet") {
    return (
      <span className="flex flex-col text-xs font-bold uppercase tracking-wider leading-none gap-0.1">
        <span className="text-xs font-bold uppercase tracking-wider text-red-200">Didn't bet </span>
        <span className="text-xs font-bold uppercase tracking-wider text-red-200/50">Looser</span>
      </span>
    );
  }

  return (
    <span className="text-xs font-medium uppercase tracking-wider text-white/45">
      Waiting
    </span>
  );
}

export default function CrashOutDemo() {
  
  const {gameState, myBalance, multiplier, countdown,progressBar, overlayOpacity, betAmount, setBetAmount, handlePlaceBet, handleCrashOut, betPlaced, cashedOut, gain, currentRound, playerState, players, setBetPlaced} = useCrashOutContext();
  //Multiplier is from the server only gotta go
  const isWaitingToLaunch = gameState === "playing" || gameState === "betting";

  function changeBet(next) {
    if (betPlaced || gameState !== "betting") return;
    setBetAmount(Math.max(0, Math.min(myBalance, betAmount + next)));
    
  }

    function reduceBet(next) {
    if (betPlaced || gameState !== "betting") return;
    setBetAmount(Math.max(0, Math.min(myBalance, next)));
    
  }
  const primaryLabel =
    gameState === "betting" && !betPlaced
      ? `Send bet · ${money(betAmount)}`
      : gameState === "betting" && betPlaced
        ? `Bet has been placed`
        : gameState === "blast_off" && !cashedOut
          ? `Cash out · ${money(Math.round(multiplier * betAmount))}`
          : gameState === "blast_off" ? `Cashed Out @ ${gain.toFixed(2)}x` :`Market is Closed`;
  return (
    <main className="relative h-full w-full font-sans text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative z-10 mx-auto h-full flex flex-col p-4">
        <header className="flex items-center justify-between border-b border-white/20 pb-4">
          {/* Compact Balance Badge */}
          <div>
            <span>{`Round ${currentRound}`}</span>
            <div className="flex items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-900/70 px-3 py-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/70">Balance</span>
              <span className="text-base font-bold tabular-nums text-emerald-400">{money(myBalance)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 text-sm font-bold uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 rounded-sm border bg-black border-orange-500 px-3 py-1 text-orange-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" /> {gameState}
            </span>
            
          </div>
      </header>

        <div className="grid flex-1 min-h-0 gap-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="order-2 border border-white/20 bg-black/85 lg:order-1">
            <div className="p-2 sm:p-3">
  <div className="flex items-center justify-between px-1 pb-2">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Players</p>
    {/* Optional player count hint for mobile scrolling */}
    <span className="text-[10px] font-mono text-white/30 lg:hidden">
      {Object.values(players).length} total
    </span>
  </div>

  {/* 2 columns on mobile with capped height & vertical scroll, 1 column & full height on desktop */}
  <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[210px] sm:max-h-[280px] lg:max-h-none lg:grid-cols-1 pr-1">
    {Object.values(players).map((player) => (
      <div
        key={player.id}
        className={`flex items-center gap-1.5 sm:gap-3 border p-2 sm:p-3 min-w-0 ${
          player.isYou ? "border-orange-500 bg-orange-500/10" : "border-white/10"
        }`}
      >
        <span
          className={`grid h-8 w-8 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full text-xs sm:text-sm font-bold ${
            player.state === "cashed_out"
              ? "bg-emerald-500 text-white"
              : player.state === "bet_placed"
              ? "bg-emerald-500/50 text-white"
              : player.state === "crashed"
              ? "bg-red-500"
              : "border-2 border-white/50 bg-white/10"
          }`}
        >
          {player.avatar}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs sm:text-sm font-bold uppercase">{player.id}</span>
          <PlayerState player={player} />
        </span>

        {/* Right side: Score as Currency */}
        <div className="ml-auto shrink-0 text-right font-mono text-xs sm:text-sm font-bold text-emerald-400">
          {typeof player.score === "number"
            ? `${money(player.score)}`
            : player.score === "NA"
            ? "$0.00"
            : `$${player.score}`}
        </div>
      </div>
    ))}
  </div>
</div>
          </aside>

          <section className="order-1 flex min-w-0 min-h-0 flex-col gap-4 lg:order-2">
            <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden border border-white/20 bg-[#090909] p-2 md:p-8">
              <div className="relative flex-1 min-h-0 w-full flex flex-col">
                  <RocketMultiplierGraph
                    multiplier={multiplier}
                    running={gameState === "blast_off"}
                  />
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
      </div>
            {/* GRID FIXED: Replaced 1fr with minmax(0,1fr) and replaced fixed 330px/360px mins with minmax(0,...) */}
            <div className="grid grid-cols-[minmax(0,1fr)_130px] sm:grid-cols-[minmax(0,1fr)_280px] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 border border-white/20 bg-black p-2 md:gap-3 md:p-3 w-full max-w-full overflow-hidden">
                <div className="flex flex-col justify-between gap-1.5 border border-white/15 p-2 md:gap-3 md:p-3 min-w-0">
                  <div className="flex items-end justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/45 md:text-xs md:tracking-[0.2em]">Your bet</p>
                      <p className="text-lg font-bold tabular-nums truncate sm:text-xl md:text-3xl">{money(betAmount)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        disabled={playerState !== "waiting"}
                        onClick={() => changeBet(myBalance)}
                        className="h-8 border border-white/30 px-1.5 text-[10px] font-bold uppercase tracking-wider transition enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30 md:h-10 md:px-2.5 md:text-xs"
                      >
                        All In
                      </button>
                      <div className="flex">
                        <button 
                          aria-label="Decrease bet" 
                          disabled={playerState !== "waiting"} 
                          onClick={() => reduceBet(betAmount - 10)} 
                          className="grid h-8 w-8 place-items-center border border-white/30 enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30 md:h-10 md:w-10"
                        >
                          <Minus size={16} className="md:hidden" />
                          <Minus size={18} className="hidden md:block" />
                        </button>
                        <button 
                          aria-label="Increase bet" 
                          disabled={playerState !== "waiting"} 
                          onClick={() => changeBet(betAmount + 10)} 
                          className="grid h-8 w-8 place-items-center border-y border-r border-white/30 enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30 md:h-10 md:w-10"
                        >
                          <Plus size={16} className="md:hidden" />
                          <Plus size={18} className="hidden md:block" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preset Chips */}
                  <div className="grid grid-cols-4 gap-1">
                    {BET_OPTIONS.map((amount) => (
                      <button 
                        key={amount} 
                        disabled={playerState !== "waiting"} 
                        onClick={() => changeBet(amount)} 
                        className={`min-h-8 border text-[10px] sm:text-xs font-bold tabular-nums transition md:min-h-11 md:text-sm px-0.5 truncate ${
                          betAmount === amount ? "border-orange-500 bg-orange-500 text-black" : "border-white/25 hover:border-white"
                        } disabled:opacity-40`}
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Column: CTA Button */}
                <button
                  onClick={
                    gameState === "betting" && !betPlaced ? handlePlaceBet : 
                    gameState === "blast_off" && !cashedOut ? handleCrashOut : undefined
                  }
                  className={`relative flex h-full min-h-0 w-full max-w-full min-w-0 items-center justify-center overflow-hidden border-2 px-1 text-center text-xs font-bold uppercase tracking-tight transition active:scale-[0.99] sm:px-4 sm:text-lg md:text-[clamp(1.1rem,2vw,2.2rem)] ${
                    playerState === "ready"
                      ? "border-orange-500 bg-orange-500 text-black hover:bg-white"
                      : "border-white bg-neutral-950 text-white"
                  }`}
                >
                  {/* Draining Background Bar (Betting Phase Only) */}
                  {gameState === "betting" && (
                    <>
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ease-linear ${
                          betPlaced ? "bg-emerald-500" : "bg-white"
                        }`}
                        style={!betPlaced ? { width: `${progressBar}%` } : { width: "100%" }}
                      />
                      <span className={`relative z-10 max-w-full break-words leading-tight ${!betPlaced ? "mix-blend-difference text-white" : ""}`}>
                        {primaryLabel}
                      </span>
                    </>
                  )}
                  
                  {gameState === "blast_off" && (
                    <>
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ease-linear ${
                          cashedOut ? "bg-emerald-500" : "bg-white"
                        }`}
                        style={{ width: "100%" }}
                      />
                      <span className={`relative z-10 max-w-full break-words leading-tight ${!cashedOut ? "mix-blend-difference text-white" : ""}`}>
                        {primaryLabel}
                      </span>
                    </>
                  )}
                  
                  {gameState !== "betting" && gameState !== "blast_off" && (
                    <span className={`relative z-10 max-w-full break-words leading-tight ${!betPlaced ? "mix-blend-difference text-white" : ""}`}>
                      {primaryLabel}
                    </span>  
                  )}
                </button>
              </div>
          </section>
        </div>
      </div>
    </main>
  );
}
