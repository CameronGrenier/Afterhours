import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, CircleHelp, Sparkles, Users, Vote } from "lucide-react";

import { selectGame, startGame, sendGameEvent } from "@/api/game";
import Button from "@/components/Button";
import MembersPanel from "@/components/MembersPanel";
import PartyCode from "@/components/PartyCode";
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
    if (seededState) {
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
      if (isHost) {
        void handleHostStart();
      } else {
        setStatusMessage("Waiting for the host to initialize the game...");
      }
    }
  }, [gameState.phase, isHost, hasAutoStarted, location.state]);

  useEffect(() => {
    if (!partyCode) {
      error("Party lost, returning to lobby");
      navigate("/");
    }
  }, [partyCode, error, navigate]);

  useSocketEvent("lobby_update", (data) => {
    setGameState((prev) => ({ ...prev, game: data?.game ?? prev.game }));
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

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_top_left,#000,70%,transparent)]" />
      <div className="relative z-10 w-full h-full grid grid-rows-[auto_minmax(0,1fr)] p-4 md:p-6 gap-4">
        <header className="flex flex-col gap-3 items-center justify-center text-center">
          <h1 className="text-3xl md:text-4xl font-display uppercase tracking-tight">
            Slang!
          </h1>
          <p className="text-sm text-white/70">Room {partyCode}</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 min-h-0">
          <section className="min-h-0 overflow-auto rounded-2xl border border-white/15 bg-black/60 p-4 md:p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/55">Current state</p>
                <h2 className="text-2xl font-bold">{turnStatus}</h2>
              </div>
              <PartyCode partyCode={partyCode} isCompact={true} position="br" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Category" value={gameState.category} />
              <StatTile label="Required letter" value={gameState.requiredLetter?.toUpperCase() ?? "—"} />
              <StatTile label="Turn" value={String(gameState.turnNumber || 0)} />
              <StatTile label="Time left" value={`${gameState.timeLeft ?? 0}s`} />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/65">
                <Sparkles size={16} />
                Live status
              </div>
              <p className="mt-2 text-lg">{statusMessage}</p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-white/80">
                  <BookOpenText size={18} />
                  <span className="font-semibold">Word chain</span>
                </div>
                <p className="mt-3 text-xl font-bold">
                  {gameState.previousWord ? `${gameState.previousWord}` : "No word yet"}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {gameState.pendingWord
                    ? `Pending vote on “${gameState.pendingWord}”`
                    : "The current chain is waiting for a fresh word."}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-white/80">
                  <Users size={18} />
                  <span className="font-semibold">Lives</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {players.map((player) => (
                    <div
                      key={player}
                      className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-sm"
                    >
                      {player}: {gameState.fails?.[player] ?? 0}/{gameState.livesTotal ?? 3}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Turn controls</p>
                  <p className="text-sm text-white/75">
                    {gameState.currentPlayer === username ? "You can play now." : "Wait for your turn."}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {gameState.phase === "seating" && (
                    <Button variant="dark" onClick={handleConfirmReady}>
                      Confirm ready
                    </Button>
                  )}
                  {gameState.phase === "turn" && (
                    <Button variant="dark" onClick={handleVoteBullshit} disabled={gameState.pendingWord === null}>
                      Vote bullshit
                    </Button>
                  )}
                  {isHost && gameState.phase !== "turn" && gameState.phase !== "seating" && (
                    <Button variant="dark" onClick={handleHostStart} disabled={isSubmitting}>
                      Restart Slang!
                    </Button>
                  )}
                </div>
              </div>

              {gameState.phase === "turn" && (
                <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmitWord}>
                  <label className="text-sm text-white/75">
                    Play a word that starts with the required letter.
                  </label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      className="w-full rounded-md border border-white/20 bg-black/45 px-4 py-3 text-white outline-none focus:border-white"
                      value={word}
                      onChange={(event) => setWord(event.target.value)}
                      placeholder="type a slang word"
                      disabled={gameState.currentPlayer !== username || isSubmitting}
                    />
                    <Button variant="light" disabled={isSubmitting || gameState.currentPlayer !== username}>
                      Submit word
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {gameState.phase === "turn" && gameState.pendingWord && (
              <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100">
                <div className="flex items-center gap-2">
                  <Vote size={18} />
                  <span className="font-semibold">Bullshit vote in progress</span>
                </div>
                <p className="mt-2">
                  {gameState.pendingWord} needs {gameState.votesNeeded} votes from the room.
                  Current count: {gameState.voteCount} / {gameState.votesNeeded}.
                </p>
              </div>
            )}
          </section>

          <aside className="min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-white/80">
              <CircleHelp size={18} />
              <span className="font-semibold">Room roster</span>
            </div>
            <MembersPanel />
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Confirmed players</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(gameState.confirmed.length ? gameState.confirmed : players).map((player) => (
                  <span
                    key={player}
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm"
                  >
                    {player}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Vote threshold</p>
              <p className="mt-1 text-xl font-bold">{gameState.voteThreshold}%</p>
            </div>
          </aside>
        </div>

        <SettingsPanel />
      </div>
    </main>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[0.7rem] uppercase tracking-[0.24em] text-white/55">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}