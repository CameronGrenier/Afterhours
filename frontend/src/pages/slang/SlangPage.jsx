import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bomb, Megaphone } from "lucide-react";

import { selectGame, startGame, sendGameEvent } from "@/api/game";
import Button from "@/components/Button";
import MembersPanel from "@/components/MembersPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { usePartyContext } from "@/hooks/usePartyContext";
import { useSocketEvent } from "@/hooks/useSocketEvent";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const REQUIRED_PLAYER_COUNT = 2;
const TURN_DURATION_FALLBACK = 30;
const URGENT_AT = 5;
const RESULT_HOLD_MS = 2400;
const BLACKOUT_HOLD_MS = 10000;

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
  turnDuration: 0,
  pendingWord: null,
  voteCount: 0,
  votesNeeded: 1,
  voteThreshold: 40,
  votedPlayers: [],
  confirmed: [],
  standings: [],
  eliminatedPlayer: null,
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
  if (payload.eliminated_player !== undefined) normalized.eliminatedPlayer = payload.eliminated_player;

  return normalized;
}

export default function SlangPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { partyCode, username, players, isHost, error, success, warning, sid } = usePartyContext();

  const [gameState, setGameState] = useState(EMPTY_STATE);
  const [word, setWord] = useState("");
  const [inputError, setInputError] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Getting the room ready…");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [voteResult, setVoteResult] = useState(null);
  const [blackout, setBlackout] = useState(null);

  const hasConsumedSeedRef = useRef(false);
  const hasRequestedStartRef = useRef(false);
  const inputRef = useRef(null);
  const voteSnapshotRef = useRef(null);

  const isMyTurn = gameState.phase === "turn" && gameState.currentPlayer === username;
  const hasConfirmed = gameState.confirmed.includes(username);
  const hasVoted = gameState.votedPlayers.includes(username);
  const isUrgent =
    gameState.phase === "turn" && gameState.timeLeft > 0 && gameState.timeLeft <= URGENT_AT;

  const myLivesUsed = gameState.fails?.[username] ?? 0;
  const myLivesTotal = gameState.livesTotal ?? 3;

  /* ------------------------------------------------------------------ */
  /* networking                                                          */
  /* ------------------------------------------------------------------ */

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
      setStatusMessage("Tap ready when you've got a drink in hand.");
      return;
    }

    if (gameState.phase === "idle" && !hasAutoStarted) {
      if (!isHost) {
        setStatusMessage("Waiting for the host to start the round.");
        return;
      }

      if (players.length < REQUIRED_PLAYER_COUNT) {
        const missing = REQUIRED_PLAYER_COUNT - players.length;
        setStatusMessage(`Need ${missing} more player${missing === 1 ? "" : "s"} to start.`);
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
      if (payload.phase && payload.phase !== "idle") setHasAutoStarted(true);
      setGameState((prev) => ({ ...prev, ...payload, game: data.game }));
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
      setStatusMessage("Tap ready when you've got a drink in hand.");
      return;
    }

    if (data.type === "SYNC_GAME") {
      const payload = normalizeGamePayload(data.payload);
      setHasAutoStarted(true);
      setGameState((prev) => {
        let usedWords = prev.usedWords || [];
        if (payload.previousWord && !usedWords.includes(payload.previousWord.toLowerCase())) {
          usedWords = [...usedWords, payload.previousWord.toLowerCase()];
        }
        return {
          ...prev,
          ...payload,
          usedWords: payload.usedWords ?? usedWords,
          turnDuration: Math.max(prev.turnDuration, payload.timeLeft ?? 0, TURN_DURATION_FALLBACK),
        };
      });
      setStatusMessage("Back in the round.");
      return;
    }

    if (data.type === "PHASE_CHANGE") {
      const payload = normalizeGamePayload(data.payload ?? {});
      setGameState((prev) => {
        let usedWords = prev.usedWords || [];
        if (payload.previousWord && !usedWords.includes(payload.previousWord.toLowerCase())) {
          usedWords = [...usedWords, payload.previousWord.toLowerCase()];
        }

        const nextPhase = payload.phase ?? prev.phase;

        return {
          ...prev,
          ...payload,
          phase: nextPhase,
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
          // pendingWord must be able to clear — `??` would pin it open forever
          pendingWord: nextPhase === "turn" ? (payload.pendingWord ?? null) : prev.pendingWord,
          standings: payload.standings ?? prev.standings,
          eliminatedPlayer: payload.eliminatedPlayer ?? prev.eliminatedPlayer,
          usedWords: payload.usedWords ?? usedWords,
          turnDuration:
            nextPhase === "turn" && payload.timeLeft
              ? payload.timeLeft
              : prev.turnDuration || TURN_DURATION_FALLBACK,
        };
      });

      if (payload.phase === "seating") {
        setStatusMessage("Waiting on the room to lock in.");
      } else if (payload.phase === "turn") {
        setWord("");
        setInputError(null);
        setStatusMessage(
          payload.currentPlayer === username
            ? "Say something. Anything."
            : `${payload.currentPlayer} is thinking.`,
        );
      } else if (payload.phase === "drinking") {
        setStatusMessage(`${payload.playerName} drinks — ${payload.reason}.`);
      } else if (payload.phase === "blackout") {
        setStatusMessage(`${payload.eliminatedPlayer} blacked out.`);
      } else if (payload.phase === "game_over") {
        setStatusMessage("Round over.");
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
    }
  });

  /* ------------------------------------------------------------------ */
  /* vote lifecycle                                                      */
  /* ------------------------------------------------------------------ */

  // Snapshot the live vote while it's open. When pendingWord clears, the
  // snapshot is the only record of what happened — the server has already
  // moved on, so the resolution beat has to be reconstructed locally.
  useEffect(() => {
    if (gameState.pendingWord) {
      const previous = voteSnapshotRef.current;
      voteSnapshotRef.current = {
        word: gameState.pendingWord,
        accused:
          previous?.word === gameState.pendingWord ? previous.accused : gameState.currentPlayer,
        voteCount: gameState.voteCount,
        votesNeeded: gameState.votesNeeded,
      };
      return;
    }

    const snapshot = voteSnapshotRef.current;
    voteSnapshotRef.current = null;
    if (snapshot && snapshot.voteCount > 0) {
      setVoteResult({
        ...snapshot,
        outcome: snapshot.voteCount >= snapshot.votesNeeded ? "busted" : "stands",
      });
    }
  }, [gameState.pendingWord, gameState.currentPlayer, gameState.voteCount, gameState.votesNeeded]);

  useEffect(() => {
    if (!voteResult) return;
    const timeout = setTimeout(() => setVoteResult(null), RESULT_HOLD_MS);
    return () => clearTimeout(timeout);
  }, [voteResult]);

  // Every submitted word opens the fullscreen challenge window. That window IS
  // the game — it's where the room decides, so it owns the whole screen.
  const showBullshit = Boolean(gameState.pendingWord) || Boolean(voteResult);

  // Latched, not derived. The server moves off `blackout` almost immediately,
  // so reading the phase directly means the overlay flickers and dies. Once a
  // blackout is seen it owns the screen for BLACKOUT_HOLD_MS regardless of
  // what state arrives next.
  useEffect(() => {
    if (gameState.phase !== "blackout" || !gameState.eliminatedPlayer) return;
    setBlackout((prev) =>
      prev?.player === gameState.eliminatedPlayer ? prev : { player: gameState.eliminatedPlayer },
    );
  }, [gameState.phase, gameState.eliminatedPlayer]);

  // The blackout is the last thing this route shows. Navigate straight out of
  // it rather than clearing the state first — clearing would unmount the
  // overlay and flash the game screen for a frame before the route changes.
  useEffect(() => {
    if (!blackout) return;
    const timeout = setTimeout(() => navigate("/lobby"), BLACKOUT_HOLD_MS);
    return () => clearTimeout(timeout);
  }, [blackout, navigate]);

  const showBlackout = Boolean(blackout);

  // Hand the keyboard to whoever is on the clock — but not while an overlay owns the screen.
  useEffect(() => {
    if (isMyTurn && !showBullshit && !showBlackout) inputRef.current?.focus();
  }, [isMyTurn, gameState.turnNumber, showBullshit, showBlackout]);

  /* ------------------------------------------------------------------ */
  /* actions                                                             */
  /* ------------------------------------------------------------------ */

  async function handleHostStart(retryCount = 0) {
    if (!isHost) {
      warning("Only the host can start the round.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selected = await selectGame(partyCode, "Slang", sid);
      if (selected.status !== "success") {
        error(selected.message ?? "Couldn't select Slang.");
        setHasAutoStarted(true);
        return;
      }

      const started = await startGame(partyCode, sid);
      if (started.status !== "success") {
        const needsRetry = /not enough players/i.test(started.message ?? "") && retryCount < 3;
        if (needsRetry) {
          setStatusMessage("Still syncing players…");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return handleHostStart(retryCount + 1);
        }
        error(started.message ?? "Couldn't start Slang.");
        setHasAutoStarted(true);
        return;
      }

      setHasAutoStarted(true);
      success("Slang! is live.");
    } catch (requestError) {
      if (retryCount < 3) {
        setStatusMessage("Still syncing players…");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return handleHostStart(retryCount + 1);
      }
      error(requestError.message ?? "Couldn't reach the Slang server.");
      setHasAutoStarted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmReady() {
    try {
      const response = await sendGameEvent(partyCode, username, "confirm_ready", {});
      if (response.status !== "success") warning(response.message ?? "Couldn't confirm ready.");
    } catch (requestError) {
      error(requestError.message ?? "Couldn't confirm ready.");
    }
  }

  async function handleSubmitWord(event) {
    event.preventDefault();
    const cleanWord = word.trim();
    if (!cleanWord) return;

    const letter = gameState.requiredLetter?.toLowerCase();
    if (letter && !cleanWord.toLowerCase().startsWith(letter)) {
      setInputError(`Has to start with ${letter.toUpperCase()}`);
      return;
    }
    if (gameState.usedWords?.includes(cleanWord.toLowerCase())) {
      setInputError(`"${cleanWord}" is already in the chain`);
      return;
    }

    try {
      setIsSubmitting(true);
      setInputError(null);
      const response = await sendGameEvent(partyCode, username, "submit_word", { word: cleanWord });
      if (response.status !== "success") {
        setInputError(response.message ?? "The room didn't accept that.");
        return;
      }
      setWord("");
    } catch (requestError) {
      setInputError(requestError.message ?? "Couldn't send that word.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoteBullshit() {
    try {
      const response = await sendGameEvent(partyCode, username, "vote_bullshit", {});
      if (response.status !== "success") warning(response.message ?? "Vote didn't land.");
    } catch (requestError) {
      error(requestError.message ?? "Vote didn't land.");
    }
  }

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */

  const accused = voteResult?.accused ?? voteSnapshotRef.current?.accused ?? gameState.currentPlayer;

  return (
    <main className="ah-scope relative flex h-dvh flex-col overflow-hidden bg-[var(--ah-ink)] text-white">
      <OverlayKeyframes />

      <header className="relative z-[3] flex w-full shrink-0 items-center justify-center py-[24px]">
        <h1 className="font-display text-3xl uppercase text-white lg:text-4xl">afterhours</h1>
      </header>
      <SettingsPanel />
      <MembersPanel />

      <LivesRow used={myLivesUsed} total={myLivesTotal} />

      <TimerBar
        timeLeft={gameState.timeLeft}
        duration={gameState.turnDuration || TURN_DURATION_FALLBACK}
        active={gameState.phase === "turn"}
        urgent={isUrgent}
      />

      <div className="mx-auto flex w-full min-w-0 max-w-md flex-1 flex-col overflow-hidden px-5">
        <Stage
          phase={gameState.phase}
          isMyTurn={isMyTurn}
          isUrgent={isUrgent}
          currentPlayer={gameState.currentPlayer}
          previousWord={gameState.previousWord}
          requiredLetter={gameState.requiredLetter}
          timeLeft={gameState.timeLeft}
          category={gameState.category}
          turnNumber={gameState.turnNumber}
          confirmedCount={gameState.confirmed.length}
          totalCount={gameState.total || players.length}
          statusMessage={statusMessage}
        />
      </div>

      <ActionDock
        phase={gameState.phase}
        isMyTurn={isMyTurn}
        isHost={isHost}
        hasConfirmed={hasConfirmed}
        hasVoted={hasVoted}
        pendingWord={gameState.pendingWord}
        voteCount={gameState.voteCount}
        votesNeeded={gameState.votesNeeded}
        confirmedCount={gameState.confirmed.length}
        totalCount={gameState.total || players.length}
        word={word}
        setWord={(value) => {
          setWord(value);
          if (inputError) setInputError(null);
        }}
        inputError={inputError}
        inputRef={inputRef}
        isSubmitting={isSubmitting}
        requiredLetter={gameState.requiredLetter}
        statusMessage={statusMessage}
        onSubmitWord={handleSubmitWord}
        onConfirmReady={handleConfirmReady}
        onVoteBullshit={handleVoteBullshit}
        onRestart={handleHostStart}
      />

      {showBullshit && (
        <BullshitOverlay
          word={voteResult?.word ?? gameState.pendingWord}
          accused={accused}
          isAccused={accused === username}
          voteCount={voteResult?.voteCount ?? gameState.voteCount}
          votesNeeded={voteResult?.votesNeeded ?? gameState.votesNeeded}
          hasVoted={hasVoted}
          outcome={voteResult?.outcome ?? null}
          timeLeft={gameState.timeLeft}
          duration={gameState.turnDuration || TURN_DURATION_FALLBACK}
          onVote={handleVoteBullshit}
        />
      )}

      {showBlackout && (
        <BlackoutOverlay
          player={blackout.player}
          isMe={blackout.player === username}
          lives={myLivesTotal}
          holdMs={BLACKOUT_HOLD_MS}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------- */
/* HUD                                                                   */
/* -------------------------------------------------------------------- */

function LivesRow({ used, total }) {
  const remaining = Math.max(0, total - used);

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-3 pb-5"
      role="img"
      aria-label={`${remaining} of ${total} lives left`}
    >
      {Array.from({ length: total }).map((_, index) => {
        const spent = index < used;
        return (
          <Bomb
            key={index}
            size={26}
            strokeWidth={1.5}
            aria-hidden
            fill={spent ? "currentColor" : "none"}
            className={cn(
              "transition-colors duration-300",
              spent ? "text-white" : "text-white/25",
            )}
          />
        );
      })}
    </div>
  );
}

function TimerBar({ timeLeft, duration, active, urgent }) {
  const pct = active && duration > 0 ? Math.min(1, Math.max(0, timeLeft / duration)) : 0;

  return (
    <div
      className="h-[3px] w-full shrink-0 bg-white/10"
      role="timer"
      aria-label={active ? `${timeLeft} seconds left in this turn` : "Turn clock stopped"}
    >
      <div
        className={cn(
          "h-full origin-left transition-[width,background-color] duration-1000 ease-linear motion-reduce:transition-none",
          urgent ? "bg-[var(--ah-danger)]" : "bg-[var(--ah-accent)]",
        )}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

function Stage({
  phase,
  isMyTurn,
  isUrgent,
  currentPlayer,
  previousWord,
  requiredLetter,
  timeLeft,
  category,
  turnNumber,
  confirmedCount,
  totalCount,
  statusMessage,
}) {
  const isLive = phase === "turn";

  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center py-4 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className={cn(
            "absolute left-1/2 top-1/2 size-[min(78vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-colors duration-500",
            isUrgent ? "bg-[var(--ah-danger-25)]" : isMyTurn ? "bg-[var(--ah-accent-25)]" : "bg-white/5",
          )}
        />
      </div>

      <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
        {category}
        {turnNumber > 0 && <span className="text-white/20"> · turn {turnNumber}</span>}
      </p>

      {phase === "seating" ? (
        <div className="mt-8 flex flex-col items-center">
          <p className="font-display text-7xl leading-none tabular-nums">
            {confirmedCount}
            <span className="text-white/25">/{totalCount}</span>
          </p>
          <p className="mt-3 text-sm text-white/50">ready to play</p>
        </div>
      ) : (
        <>
          <p
            aria-live="assertive"
            className={cn(
              "mt-6 font-display text-2xl leading-tight transition-colors duration-200",
              isMyTurn ? "text-[var(--ah-accent)]" : "text-white",
            )}
          >
            {isLive ? (isMyTurn ? "Your turn" : truncateName(currentPlayer)) : "—"}
          </p>

          <div className="mt-6 flex w-full flex-col items-center">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">last word</p>
            <p className="mt-1 w-full break-all px-2 text-xl font-medium text-white/80">
              {previousWord ?? "—"}
            </p>

            <span aria-hidden className="mt-4 block h-6 w-px bg-white/15" />

            <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-white/35">starts with</p>
            <p
              className={cn(
                "font-display text-[clamp(7rem,38vw,11rem)] leading-[0.85] tracking-tight transition-colors duration-200",
                isUrgent ? "text-[var(--ah-danger)]" : isMyTurn ? "text-[var(--ah-accent)]" : "text-white",
              )}
            >
              {requiredLetter?.toUpperCase() ?? "—"}
            </p>
          </div>

          {isLive && (
            <p
              className={cn(
                "mt-2 font-mono text-sm tabular-nums transition-colors duration-200",
                isUrgent ? "text-[var(--ah-danger)]" : "text-white/40",
              )}
            >
              {timeLeft}s
            </p>
          )}
        </>
      )}

      {phase === "idle" && (
        <p className="mt-8 max-w-[38ch] text-sm text-white/45" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </section>
  );
}

function ActionDock({
  phase,
  isMyTurn,
  isHost,
  hasConfirmed,
  hasVoted,
  pendingWord,
  voteCount,
  votesNeeded,
  confirmedCount,
  totalCount,
  word,
  setWord,
  inputError,
  inputRef,
  isSubmitting,
  requiredLetter,
  statusMessage,
  onSubmitWord,
  onConfirmReady,
  onVoteBullshit,
  onRestart,
}) {
  return (
    <div className="shrink-0 border-t border-[var(--ah-line)] bg-[var(--ah-raise-80)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
      {phase === "seating" &&
        (hasConfirmed ? (
          <p className="py-3 text-center text-sm text-white/45" aria-live="polite">
            Waiting on {Math.max(0, totalCount - confirmedCount)} more
          </p>
        ) : (
          <Button type="button" variant="light" className="min-h-[52px] w-full" onClick={onConfirmReady}>
            I'm ready
          </Button>
        ))}

      {phase === "turn" && isMyTurn && (
        <form onSubmit={onSubmitWord} noValidate>
          <label htmlFor="slang-word" className="sr-only">
            A slang word starting with {requiredLetter?.toUpperCase()}
          </label>
          <div className="flex min-w-0 gap-2">
            <input
              id="slang-word"
              ref={inputRef}
              value={word}
              onChange={(event) => setWord(event.target.value)}
              placeholder={requiredLetter ? `${requiredLetter.toLowerCase()}…` : "your word"}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              aria-invalid={Boolean(inputError)}
              aria-describedby={inputError ? "slang-word-error" : undefined}
              className={cn(
                "min-h-[52px] w-full min-w-0 rounded-lg border bg-black/60 px-4 text-base text-white",
                "outline-none transition-colors duration-150",
                "placeholder:text-white/25 focus-visible:ring-2 focus-visible:ring-[var(--ah-accent-60)]",
                inputError ? "border-[var(--ah-danger)]" : "border-[var(--ah-line)] focus-visible:border-[var(--ah-accent)]",
              )}
            />
            <Button
              type="submit"
              variant="light"
              className="min-h-[52px] shrink-0 px-5"
              disabled={isSubmitting || !word.trim()}
            >
              {isSubmitting ? "Sending" : "Send"}
            </Button>
          </div>
          {inputError && (
            <p id="slang-word-error" role="alert" className="mt-2 text-sm text-[var(--ah-danger)]">
              {inputError}
            </p>
          )}
        </form>
      )}

      {/* No action here while someone else plays — the challenge lives fullscreen. */}
      {phase === "turn" && !isMyTurn && (
        <p className="py-4 text-center text-sm text-white/35" aria-live="polite">
          Waiting for a word
        </p>
      )}

      {(phase === "idle" || phase === "game_over") && isHost && (
        <Button
          type="button"
          variant="light"
          className="min-h-[52px] w-full"
          onClick={() => onRestart()}
          disabled={isSubmitting}
        >
          {phase === "game_over" ? "Play again" : "Start round"}
        </Button>
      )}

      {phase !== "idle" && (
        <p className="mt-3 text-center text-xs text-white/35" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Fullscreen moments                                                    */
/* -------------------------------------------------------------------- */

function BullshitOverlay({
  word,
  accused,
  isAccused,
  voteCount,
  votesNeeded,
  hasVoted,
  outcome,
  timeLeft,
  duration,
  onVote,
}) {
  const callRef = useRef(null);
  const resolved = Boolean(outcome);
  const busted = outcome === "busted";

  const pressure = votesNeeded > 0 ? Math.min(1, voteCount / votesNeeded) : 0;
  const clock = duration > 0 ? Math.min(1, Math.max(0, timeLeft / duration)) : 0;
  const showDots = votesNeeded <= 8;

  useEffect(() => {
    if (!resolved && !hasVoted && !isAccused) callRef.current?.focus();
  }, [resolved, hasVoted, isAccused]);

  // Long words have to shrink or they blow the viewport. Three steps rather
  // than a fluid formula so the type still lands on a deliberate size.
  const length = word?.length ?? 0;
  const wordSize =
    length > 14
      ? "clamp(1.75rem, 9vw, 3rem)"
      : length > 9
        ? "clamp(2.5rem, 14vw, 4.25rem)"
        : "clamp(3.5rem, 22vw, 6.5rem)";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Bullsh*t challenge"
      className="ah-in fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--ah-ink)]"
    >
      {/* Pressure field. Grows and reddens with every vote that lands. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-all duration-500"
        style={{
          background: `radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--ah-danger) ${14 + pressure * 40}%, transparent) 0%, transparent ${52 + pressure * 20}%)`,
        }}
      />

      {/* Challenge window clock, full bleed across the top. */}
      {!resolved && timeLeft > 0 && (
        <div className="relative h-[3px] w-full shrink-0 bg-white/10" aria-hidden>
          <div
            className="h-full origin-left bg-[var(--ah-danger)] transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
            style={{ width: `${clock * 100}%` }}
          />
        </div>
      )}

      {resolved ? (
        <div
          className="ah-slam relative flex flex-1 flex-col items-center justify-center px-6 text-center"
          aria-live="assertive"
        >
          <h2
            className={cn(
              "font-display text-[clamp(3.5rem,21vw,7.5rem)] uppercase leading-[0.82] tracking-tight",
              busted ? "text-[var(--ah-danger)]" : "text-[var(--ah-accent)]",
            )}
          >
            {busted ? "Busted" : "It stands"}
          </h2>
          <p
            className={cn(
              "mt-8 w-full break-all font-display text-3xl",
              busted ? "text-white/40 line-through decoration-[var(--ah-danger)] decoration-[3px]" : "text-white",
            )}
          >
            {word}
          </p>
          <p className="mt-4 max-w-[30ch] text-sm text-white/45">
            {busted
              ? `${truncateName(accused)} made it up.`
              : `${truncateName(accused)} was telling the truth.`}
          </p>
        </div>
      ) : (
        <>
          {/* ── the word on trial, centred in the remaining space ───────── */}
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
              {isAccused ? "the room is deciding" : `${truncateName(accused)} played`}
            </p>

            <p
              className="mt-6 w-full break-all font-display uppercase leading-[0.9] tracking-tight text-white"
              style={{ fontSize: wordSize }}
            >
              {word}
            </p>

            <p className="mt-6 text-sm text-white/40">
              {isAccused ? "Hold your nerve." : "Real word, or nonsense?"}
            </p>
          </div>

          {/* ── live vote tally ─────────────────────────────────────────── */}
          <div className="relative shrink-0 px-6">
            {showDots ? (
              <div className="flex items-center justify-center gap-2.5">
                {Array.from({ length: Math.max(votesNeeded, voteCount) }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "block size-3.5 rounded-full transition-all duration-200",
                      index < voteCount
                        ? "scale-110 bg-[var(--ah-danger)] shadow-[0_0_12px_var(--ah-danger)]"
                        : "border border-white/20",
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full origin-left rounded-full bg-[var(--ah-danger)] transition-[width] duration-200"
                  style={{ width: `${pressure * 100}%` }}
                />
              </div>
            )}

            <p
              className="mt-4 text-center font-mono text-sm tabular-nums text-white/55"
              aria-live="polite"
            >
              {voteCount === 0
                ? `${votesNeeded} calls to bust it`
                : `${voteCount} of ${votesNeeded} called it`}
            </p>
          </div>

          {/* ── the call, in the thumb zone ─────────────────────────────── */}
          <div className="relative shrink-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
            {isAccused ? (
              <p className="py-6 text-center text-sm uppercase tracking-[0.25em] text-white/30">
                nothing you can do
              </p>
            ) : hasVoted ? (
              <p className="flex min-h-[76px] items-center justify-center gap-2 rounded-2xl border border-[var(--ah-danger-40)] font-display text-xl uppercase tracking-wide text-[var(--ah-danger)]">
                <Megaphone size={20} aria-hidden />
                You called it
              </p>
            ) : (
              <button
                ref={callRef}
                type="button"
                onClick={onVote}
                className="flex min-h-[76px] w-full items-center justify-center gap-3 rounded-2xl bg-[var(--ah-danger)] font-display text-2xl uppercase tracking-wide text-black outline-none transition-transform duration-150 active:scale-[0.97] focus-visible:ring-4 focus-visible:ring-[var(--ah-danger-40)] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Megaphone size={24} aria-hidden />
                Bullsh*t
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BlackoutOverlay({ player, isMe, lives, holdMs }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.round(holdMs / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Black out"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-center"
    >
      {/* Camera-flash entrance — the screen whites out, then you come to. */}
      <div aria-hidden className="ah-flash pointer-events-none absolute inset-0 bg-white" />

      <div className="ah-in flex flex-col items-center" aria-live="assertive">
        <div className="flex items-center gap-3">
          {Array.from({ length: lives }).map((_, index) => (
            <Bomb
              key={index}
              size={22}
              strokeWidth={1.5}
              fill="currentColor"
              className="text-white/70"
              aria-hidden
            />
          ))}
        </div>

        {/* Double-vision: a blurred duplicate sitting just off the sharp layer. */}
        <div className="relative mt-8">
          <span
            aria-hidden
            className="ah-drift absolute inset-0 font-display text-[clamp(3.5rem,19vw,6.5rem)] uppercase leading-[0.85] tracking-tight text-[var(--ah-accent)] blur-[6px]"
          >
            Black out
          </span>
          <h2 className="relative font-display text-[clamp(3.5rem,19vw,6.5rem)] uppercase leading-[0.85] tracking-tight text-white">
            Black out
          </h2>
        </div>

        <p className="mt-10 font-display text-3xl text-white">
          {isMe ? "That's you" : truncateName(player)}
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/45">
          {isMe ? "take the shot" : "make them drink"}
        </p>
      </div>

      {/* The hold has a job: it's the drinking window, not a delay. Saying so
          turns waiting into an instruction. */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="mb-3 text-center font-mono text-xs tabular-nums text-white/35">
          back to lobby in {secondsLeft}s
        </p>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="ah-drain h-full w-full rounded-full bg-white/50"
            style={{ animationDuration: `${holdMs}ms` }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

/* Kept inline so both overlays live in one file. Move to your global stylesheet
   if you'd rather not ship a <style> tag with the route. */
function OverlayKeyframes() {
  return (
    <style>{`
      /* Point these at your real theme tokens when you have them — one edit,
         one source of truth for the whole route. */
      .ah-scope {
        --ah-ink:        #050505;
        --ah-raise-80:   rgb(11 11 11 / 0.8);
        --ah-line:       rgb(255 255 255 / 0.12);
        --ah-accent:     #ff5b19;
        --ah-accent-25:  rgb(255 91 25 / 0.25);
        --ah-accent-60:  rgb(255 91 25 / 0.6);
        --ah-danger:     #ff3b30;
        --ah-danger-25:  rgb(255 59 48 / 0.25);
        --ah-danger-40:  rgb(255 59 48 / 0.4);
      }

      @keyframes ah-flash { from { opacity: 1 } to { opacity: 0 } }
      @keyframes ah-in { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
      @keyframes ah-slam {
        0%   { opacity: 0; transform: scale(1.3) }
        55%  { opacity: 1; transform: scale(0.97) }
        100% { opacity: 1; transform: scale(1) }
      }
      @keyframes ah-drain { from { transform: scaleX(1) } to { transform: scaleX(0) } }
      @keyframes ah-drift {
        0%, 100% { transform: translate(-2px, 1px) }
        50%      { transform: translate(3px, -2px) }
      }
      .ah-flash { animation: ah-flash 500ms ease-out forwards }
      .ah-in    { animation: ah-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both }
      .ah-slam  { animation: ah-slam 320ms cubic-bezier(0.22, 1, 0.36, 1) both }
      .ah-drift { animation: ah-drift 2.4s ease-in-out infinite }
      .ah-drain { transform-origin: left; animation: ah-drain linear forwards }
      @media (prefers-reduced-motion: reduce) {
        .ah-flash { animation: none; opacity: 0 }
        .ah-in, .ah-slam, .ah-drift { animation: none }
        .ah-drain { animation-timing-function: linear }
      }
    `}</style>
  );
}

function truncateName(name) {
  if (!name) return "Someone";
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}