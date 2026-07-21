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
  const [bet, setBet] = useState(50);
  const [balance, setBalance] = useState(1240);
  const [roundNumber, setRoundNumber] = useState(0);
  const {gameState, myBalance} = useCrashOutContext();
  //Multiplier is from the server only gotta go
  const [multiplier, setMultiplier] = useState(0);
  const [roundRunning, setRoundRunning] = useState(false);
  const [playerState, setPlayerState] = useState("waiting");
  const [cashout, setCashout] = useState(null);

  useEffect(() => {
    if (!roundRunning) return undefined;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - started) / 1000;
      setMultiplier(elapsed * 0.7 + elapsed * elapsed * 0.055);
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
        if (playerState === "ready") return { ...player, state: "ready", bet };
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
  }, [bet, cashout, lobbyPlayers, playerState, username]);

  function changeBet(next) {
    if (playerState !== "waiting") return;
    setBet(Math.max(10, Math.min(balance, next)));
  }

  function placeBet() {
    if (bet > balance || bet <= 0) return;
    setCashout(null);
    setBalance((current) => current - bet);
    setPlayerState("ready");
    setMultiplier(0);
    setRoundRunning(true);
  }

  function cashOut() {
    if (playerState !== "ready" || !roundRunning) return;
    const payout = Math.round(bet * multiplier);
    setBalance((current) => current + payout);
    setCashout({ multiplier, payout });
    setPlayerState("cashed");
    setRoundRunning(false);
  }

  function resetRound() {
    setPlayerState("waiting");
    setCashout(null);
    setMultiplier(0);
    setRoundRunning(false);
  }

  const primaryLabel =
    playerState === "waiting"
      ? `Send bet · ${money(bet)}`
      : playerState === "ready"
        ? `Cash out · ${money(Math.round(bet * multiplier))}`
        : `Cashed out · ${cashout.multiplier.toFixed(2)}×`;

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
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" /> Live
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
              <div className="absolute inset-x-0 bottom-[22%] h-px bg-white/20" />
              <div className="absolute inset-x-[8%] bottom-[22%] h-[44%] origin-bottom-left skew-y-[-9deg] border-t-2 border-orange-500" />
              <div className="absolute right-[10%] top-[16%] text-orange-500 transition-transform duration-300" style={{ transform: `translateY(${-Math.min(multiplier * 3, 28)}px) rotate(42deg)` }}>
                <Rocket size={82} strokeWidth={1.5} fill="currentColor" className="text-orange-500" />
              </div>
              <div className="relative flex h-full min-h-[310px] flex-col items-center justify-center text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
                  {roundRunning ? "Rocket climbing" : playerState === "cashed" ? "Payout locked" : "Place your bet"}
                </p>
                <p className="font-display text-[clamp(5rem,14vw,12rem)] leading-none tracking-[-0.06em] tabular-nums">
                  {multiplier.toFixed(2)}×
                </p>
                <p className="mt-4 max-w-md text-sm text-white/50">
                  {playerState === "waiting" && "Choose an amount below. Your bet will be shown on the main button before you send it."}
                  {playerState === "ready" && "You’re in. Cash out any time to lock your current multiplier."}
                  {playerState === "cashed" && `You locked ${money(cashout.payout)} at ${cashout.multiplier.toFixed(2)}×.`}
                </p>
              </div>
            </div>

            <div className="grid gap-3 border border-white/20 bg-black p-3 md:grid-cols-[minmax(330px,0.85fr)_minmax(360px,1.15fr)]">
              <div className="flex flex-col gap-3 border border-white/15 p-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Your bet</p>
                    <p className="text-3xl font-bold tabular-nums">{money(bet)}</p>
                  </div>
                  <div className="flex">
                    <button aria-label="Decrease bet" disabled={playerState !== "waiting"} onClick={() => changeBet(bet - 10)} className="grid h-10 w-10 place-items-center border border-white/30 enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30"><Minus size={18} /></button>
                    <button aria-label="Increase bet" disabled={playerState !== "waiting"} onClick={() => changeBet(bet + 10)} className="grid h-10 w-10 place-items-center border-y border-r border-white/30 enabled:hover:bg-white enabled:hover:text-black disabled:opacity-30"><Plus size={18} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {BET_OPTIONS.map((amount) => (
                    <button key={amount} disabled={playerState !== "waiting"} onClick={() => changeBet(amount)} className={`min-h-11 border text-sm font-bold tabular-nums transition ${bet === amount ? "border-orange-500 bg-orange-500 text-black" : "border-white/25 hover:border-white"} disabled:opacity-40`}>
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {playerState === "cashed" ? (
                <button onClick={resetRound} className="flex min-h-28 items-center justify-center gap-3 border-2 border-white bg-white px-6 text-xl font-bold uppercase tracking-wide text-black hover:bg-orange-500">
                  <RotateCcw /> Next round
                </button>
              ) : (
                <button
                  onClick={playerState === "waiting" ? placeBet : cashOut}
                  className={`min-h-28 border-2 px-6 text-[clamp(1.4rem,3vw,2.6rem)] font-bold uppercase tracking-tight transition active:scale-[0.99] ${playerState === "ready" ? "border-orange-500 bg-orange-500 text-black hover:bg-white" : "border-white bg-white text-black hover:border-orange-500 hover:bg-orange-500"}`}
                >
                  {primaryLabel}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
