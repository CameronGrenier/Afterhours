import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, CircleHelp, Clock3, Sparkles, Users, Vote } from "lucide-react";

import { selectGame, startGame, sendGameEvent } from "@/api/game";
import Button from "@/components/Button";
import MembersPanel from "@/components/MembersPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { usePartyContext } from "@/hooks/usePartyContext";
import { useSocketEvent } from "@/hooks/useSocketEvent";

const EMPTY_STATE = {
  phase: "idle",
  game: null,
  turnOrder: [],
  startingLives: 3,
  currentPlayer: null,
  previousWord: null,
  requiredLetter: null,
  fails: {},
  livesTotal: 3,
  timeLeft: 0,
  pendingWord: null,
  voteCount: 0,
  votesNeeded: 1,
  voteThreshold: 40,
  votedPlayers: [],
  confirmed: [],
  total: 0,
  turnNumber: 0,
  category: "Slang Words",
  usedWords: [],
};

function normalizeGamePayload(payload = {}) {
  const normalized = { ...payload };

  if (payload.turn_order !== undefined) normalized.turnOrder = payload.turn_order;
  if (payload.starting_lives !== undefined) normalized.startingLives = payload.starting_lives;
  if (payload.current_player !== undefined) normalized.currentPlayer = payload.current_player;
  if (payload.previous_word !== undefined) normalized.previousWord = payload.previous_word;
  if (payload.required_letter !== undefined) normalized.requiredLetter = payload.required_letter;
  if (payload.pending_word !== undefined) normalized.pendingWord = payload.pending_word;
  if (payload.vote_count !== undefined) normalized.voteCount = payload.vote_count;
  if (payload.votes_needed !== undefined) normalized.votesNeeded = payload.votes_needed;
  if (payload.vote_threshold !== undefined) normalized.voteThreshold = payload.vote_threshold;
  if (payload.voted_players !== undefined) normalized.votedPlayers = payload.voted_players;
  if (payload.turn_number !== undefined) normalized.turnNumber = payload.turn_number;

  return normalized;
}

export default function SlangPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    partyCode,
    username,
    players,
    isHost,
    error,
    success,
    warning,
  } = usePartyContext();

  const [gameState, setGameState] = useState(EMPTY_STATE);
  const [word, setWord] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Choose Slang! from the room to begin the round.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const hasConsumedSeedRef = useRef(false);
  const hasRequestedStartRef = useRef(false);
  const requiredPlayerCount = 2;

  useEffect(() => {
    if (gameState.timeLeft <= 0 || gameState.phase !== "turn") return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.phase, gameState.timeLeft]);

  useEffect(() => {
    const seededState = location.state?.gameState;

    if (seededState && !hasConsumedSeedRef.current) {
      hasConsumedSeedRef.current = true;
      setHasAutoStarted(true);
      setGameState((prev) => ({
        ...prev,
        phase: "seating",
        game: seededState.game ?? prev.game,
        turnOrder: seededState.turn_order ?? prev.turnOrder,
        startingLives: seededState.starting_lives ?? prev.startingLives,
        livesTotal: seededState.starting_lives ?? prev.livesTotal,
        total: seededState.turn_order?.length ?? prev.total,
      }));
      setStatusMessage("Everyone confirm ready to kick off the chain.");
      return;
    }

    if (gameState.phase === "idle" && !hasAutoStarted) {
      if (!isHost) {
        setStatusMessage("Waiting for the host to initialize the game...");
        return;
      }

      if (players.length < requiredPlayerCount) {
        const missingPlayers = requiredPlayerCount - players.length;
        setStatusMessage(
          `Waiting for ${missingPlayers} more player${missingPlayers === 1 ? "" : "s"} to join before starting Slang...`,
        );
        return;
      }

      if (!hasRequestedStartRef.current) {
        hasRequestedStartRef.current = true;
        void handleHostStart();
      }
    }
  }, [gameState.phase, isHost, hasAutoStarted, location.state?.gameState, players.length]);

  useEffect(() => {
    if (!partyCode) {
      error("Party lost, returning to lobby");
      navigate("/");
    }
  }, [partyCode, error, navigate]);

  useSocketEvent("lobby_update", (data) => {
    if (data?.game) {
      const payload = normalizeGamePayload(data.game);
      if (payload.phase && payload.phase !== "idle") {
        setHasAutoStarted(true);
      }
      setGameState((prev) => ({ 
        ...prev, 
        ...payload,
        game: data.game 
      }));
    } else {
      setGameState((prev) => ({ ...prev, game: data?.game ?? prev.game }));
    }
  });

  useSocketEvent("game_update", (data) => {
    if (!data?.payload) return;

    if (data.type === "START_GAME") {
      const payload = normalizeGamePayload(data.payload);
      setHasAutoStarted(true);
      setGameState((prev) => ({
        ...prev,
        phase: "seating",
        game: payload.game ?? prev.game,
        turnOrder: payload.turnOrder ?? [],
        startingLives: payload.startingLives ?? 3,
        livesTotal: payload.startingLives ?? 3,
        total: payload.turnOrder?.length ?? 0,
        usedWords: [],
      }));
      setStatusMessage("Everyone confirm ready to kick off the chain.");
      return;
    }

    if (data.type === "SYNC_GAME") {
      const payload = normalizeGamePayload(data.payload);
      setHasAutoStarted(true);
      setGameState((prev) => {
        let newUsedWords = prev.usedWords || [];
        if (payload.previousWord && !newUsedWords.includes(payload.previousWord.toLowerCase())) {
          newUsedWords = [...newUsedWords, payload.previousWord.toLowerCase()];
        }
        return {
          ...prev,
          ...payload,
          usedWords: payload.usedWords ?? newUsedWords,
        };
      });
      setStatusMessage("Synced to the active game round.");
      return;
    }

    if (data.type === "PHASE_CHANGE") {
      const payload = normalizeGamePayload(data.payload ?? {});
      setGameState((prev) => {
        let newUsedWords = prev.usedWords || [];
        if (payload.previousWord && !newUsedWords.includes(payload.previousWord.toLowerCase())) {
          newUsedWords = [...newUsedWords, payload.previousWord.toLowerCase()];
        }

        return {
          ...prev,
          ...payload,
          phase: payload.phase ?? prev.phase,
          voteThreshold: payload.voteThreshold ?? prev.voteThreshold,
          voteCount: payload.voteCount ?? prev.voteCount,
          votesNeeded: payload.votesNeeded ?? prev.votesNeeded,
          votedPlayers: payload.votedPlayers ?? prev.votedPlayers,
          confirmed: payload.confirmed ?? prev.confirmed,
          total: payload.total ?? prev.total,
          currentPlayer: payload.currentPlayer ?? prev.currentPlayer,
          previousWord: payload.previousWord ?? prev.previousWord,
          requiredLetter: payload.requiredLetter ?? prev.requiredLetter,
          fails: payload.fails ?? prev.fails,
          livesTotal: payload.livesTotal ?? prev.livesTotal,
          timeLeft: payload.timeLeft ?? prev.timeLeft,
          pendingWord: payload.pendingWord ?? prev.pendingWord,
          standngs: payload.standings ?? prev.standings,
          usedWords: payload.usedWords ?? newUsedWords,
        };
      });

      if (payload.phase === "seating") {
        setStatusMessage("Players are confirming readiness.");
      } else if (payload.phase === "turn") {
        setStatusMessage(
          payload.currentPlayer === username
            ? `You are up. Start with ${payload.requiredLetter?.toUpperCase()}.`
            : `${payload.currentPlayer} is taking the turn.`,
        );
      } else if (payload.phase === "drinking") {
        setStatusMessage(
          `${payload.playerName} lost a life for ${payload.reason}. Next up: ${payload.nextPlayerName}.`,
        );
      } else if (payload.phase === "blackout") {
        setStatusMessage(`${payload.eliminatedPlayer} is out of the game.`);
      } else if (payload.phase === "game_over") {
        setStatusMessage("The Slang! round is over.");
      }
    }

    if (data.type === "PLAYER_ACTION") {
      const details = data.payload?.details ?? {};
      setGameState((prev) => ({
        ...prev,
        confirmed: details.confirmed ?? prev.confirmed,
        total: details.total ?? prev.total,
        voteCount: details.voteCount ?? prev.voteCount,
        votesNeeded: details.votesNeeded ?? prev.votesNeeded,
        votedPlayers: details.votedPlayers ?? prev.votedPlayers,
        pendingWord: details.pendingWord ?? prev.pendingWord,
      }));

      if (details.confirmed) {
        setStatusMessage("A player confirmed ready. Seating is updating.");
      } else if (details.voteCount !== undefined) {
        setStatusMessage(`Vote count updated: ${details.voteCount}/${details.votesNeeded}.`);
      } else if (details.word) {
        setStatusMessage(`Word update: ${details.word}.`);
      } else {
        setStatusMessage("Move locked in.");
      }
    }
  });

  const turnStatus = useMemo(() => {
    if (gameState.phase === "turn") {
      return gameState.currentPlayer === username
        ? "Your turn"
        : `${gameState.currentPlayer ?? "Someone"} is on the board`;
    }

    if (gameState.phase === "seating") {
      return `${gameState.confirmed.length}/${gameState.total} confirmed`;
    }

    if (gameState.phase === "drinking") {
      return "Drink break";
    }

    if (gameState.phase === "blackout") {
      return "Round complete";
    }

    return "Awaiting game";
  }, [gameState, username]);

  async function handleHostStart(retryCount = 0) {
    if (!isHost) {
      warning("Only the room host can launch the game.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selected = await selectGame(partyCode, "Slang");
      if (selected.status !== "success") {
        error(selected.message ?? "Unable to select Slang.");
        setHasAutoStarted(true);
        return;
      }

      const started = await startGame(partyCode);
      if (started.status !== "success") {
        const needsRetry = /not enough players/i.test(started.message ?? "") && retryCount < 3;
        if (needsRetry) {
          setStatusMessage("The room is still syncing players. Trying again...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return handleHostStart(retryCount + 1);
        }

        error(started.message ?? "Unable to start Slang.");
        setHasAutoStarted(true);
        return;
      }

      setHasAutoStarted(true);
      success("Slang! is live.");
    } catch (requestError) {
      if (retryCount < 3) {
        setStatusMessage("The room is still syncing players. Trying again...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return handleHostStart(retryCount + 1);
      }

      error(requestError.message ?? "Unable to contact the Slang server.");
      setHasAutoStarted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmReady() {
    try {
      console.log("My username is: ", username)
      const response = await sendGameEvent(partyCode, username, "confirm_ready", {});
      if (response.status !== "success") {
        warning(response.message ?? "Could not confirm ready.");
        return;
      }
      setStatusMessage("Ready confirmed. Waiting for the room to lock in.");
    } catch (requestError) {
      error(requestError.message ?? "Failed to confirm ready.");
    }
  }

  async function handleSubmitWord(event) {
    event.preventDefault();
    const cleanWord = word.trim();
    if (!cleanWord) return;

    if (gameState.usedWords?.includes(cleanWord.toLowerCase())) {
      warning(`The word "${cleanWord}" has already been used!`);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await sendGameEvent(partyCode, username, "submit_word", { word: cleanWord });
      if (response.status !== "success") {
        warning(response.message ?? "Could not submit that word.");
        return;
      }

      setWord("");
      setStatusMessage("Word submitted. Waiting for the room response.");
    } catch (requestError) {
      error(requestError.message ?? "Failed to submit word.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoteBullshit() {
    try {
      const response = await sendGameEvent(partyCode, username, "vote_bullshit", {});
      if (response.status !== "success") {
        warning(response.message ?? "Vote could not be recorded.");
        return;
      }
      setStatusMessage("Vote recorded.");
    } catch (requestError) {
      error(requestError.message ?? "Failed to vote.");
    }
  }

  const phaseLabel =
    gameState.phase === "turn"
      ? "Turn active"
      : gameState.phase === "seating"
        ? "Seating open"
        : gameState.phase === "drinking"
          ? "Drink break"
          : gameState.phase === "blackout"
            ? "Round complete"
            : "Awaiting game";

  return (
    <main className="relative h-dvh overflow-hidden bg-[#050505] text-white flex flex-col">
      <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_20%_20%,transparent_0,transparent_18%,#ff5b19_18.2%,transparent_18.5%),radial-gradient(circle_at_85%_30%,transparent_0,transparent_16%,#fff_16.2%,transparent_16.4%)] pointer-events-none" />
      
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Adjusted Header: Grid layout with Settings left, Titles middle, Members right */}
        <header className="grid grid-cols-3 items-center gap-3 border-b border-white/20 pb-4 shrink-0">
          <div className="flex justify-start">
            <SettingsPanel />
          </div>
          
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Afterhours</p>
            <h1 className="text-3xl font-display uppercase tracking-tight text-white sm:text-4xl">
              Slang!
            </h1>
            <div className="mt-2 flex items-center justify-center">
              <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400 whitespace-nowrap">
                {phaseLabel}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end">
            <MembersPanel />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:overflow-hidden gap-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="order-2 flex flex-col gap-4 lg:order-1 lg:overflow-y-auto pr-1">
            
            {/* Removed the Room Roster panel as requested */}

            <div className="shrink-0 rounded-2xl border border-white/15 bg-black/70 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/75">
                <CircleHelp size={16} />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Round info</span>
              </div>
              <div className="mt-3 grid gap-2">
                <InfoChip label="Vote threshold" value={`${gameState.voteThreshold}%`} />
                <InfoChip
                  label="Confirmed"
                  value={`${gameState.confirmed.length}/${gameState.total || players.length}`}
                />
                <InfoChip label="Required letter" value={gameState.requiredLetter?.toUpperCase() ?? "—"} />
              </div>
            </div>
          </aside>

          <section className="order-1 flex flex-col gap-4 lg:order-2 lg:overflow-y-auto pr-1">
            <div className="grid shrink-0 gap-3 grid-cols-2 md:grid-cols-4">
              <StatTile label="Current state" value={turnStatus} />
              <StatTile label="Category" value={gameState.category} />
              <StatTile label="Turn" value={String(gameState.turnNumber || 0)} />
              <StatTile label="Time left" value={`${gameState.timeLeft ?? 0}s`} />
            </div>

            <div className="shrink-0 rounded-2xl border border-white/15 bg-[#090909]/90 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_60px_rgba(0,0,0,0.4)] md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                  <Sparkles size={16} />
                  Live status
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  Room {partyCode}
                </span>
              </div>
              <p className="mt-3 text-lg text-white/90">{statusMessage}</p>
            </div>

            <div className="grid shrink-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-white/15 bg-black/70 p-4 md:p-5">
                <div className="flex items-center gap-2 text-white/80">
                  <BookOpenText size={18} />
                  <span className="font-semibold">Word chain</span>
                </div>
                <p className="mt-4 text-2xl font-bold break-words">
                  {gameState.previousWord ? `${gameState.previousWord}` : "No word yet"}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {gameState.pendingWord
                    ? `Pending vote on “${gameState.pendingWord}”`
                    : "The current chain is awaiting a fresh entry."}
                </p>

                {gameState.phase === "turn" && gameState.pendingWord && (
                  <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-amber-100">
                    <div className="flex items-center gap-2">
                      <Vote size={16} />
                      <span className="font-semibold">Bullshit vote in progress</span>
                    </div>
                    <p className="mt-2 text-sm">
                      {gameState.pendingWord} needs {gameState.votesNeeded} votes from the room.
                      Current count: {gameState.voteCount} / {gameState.votesNeeded}.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/15 bg-black/70 p-4 md:p-5">
                <div className="flex items-center gap-2 text-white/80">
                  <Users size={18} />
                  <span className="font-semibold">Lives</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {players.map((player) => (
                    <div
                      key={player}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85"
                    >
                      {player}: {gameState.fails?.[player] ?? 0}/{gameState.livesTotal ?? 3}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock3 size={16} />
                    <span>Turn controls</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gameState.phase === "seating" && (
                      <Button type="button" variant="dark" onClick={handleConfirmReady}>
                        Confirm ready
                      </Button>
                    )}
                    {gameState.phase === "turn" && (
                      <Button type="button" variant="dark" onClick={handleVoteBullshit} disabled={gameState.pendingWord === null}>
                        Vote bullshit
                      </Button>
                    )}
                    {isHost && gameState.phase !== "turn" && gameState.phase !== "seating" && (
                      <Button type="button" variant="dark" onClick={handleHostStart} disabled={isSubmitting}>
                        Restart Slang!
                      </Button>
                    )}
                  </div>

                  {gameState.phase === "turn" && (
                    <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmitWord}>
                      <label className="text-sm text-white/75">
                        Play a word that starts with the required letter.
                      </label>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <input
                          className="w-full rounded-md border border-white/20 bg-black/45 px-4 py-3 text-white outline-none focus:border-white"
                          value={word}
                          onChange={(event) => setWord(event.target.value)}
                          placeholder="type a slang word"
                          disabled={gameState.currentPlayer !== username || isSubmitting}
                        />
                        <Button type="submit" variant="light" disabled={isSubmitting || gameState.currentPlayer !== username}>
                          Submit word
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/70 p-3 backdrop-blur-sm">
      <p className="text-[0.7rem] uppercase tracking-[0.24em] text-white/55 truncate">{label}</p>
      <p className="mt-2 text-lg font-semibold truncate">{value}</p>
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 flex items-center justify-between gap-4">
      <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45 shrink-0">{label}</p>
      <p className="text-sm font-semibold text-white/90 truncate">{value}</p>
    </div>
  );
}