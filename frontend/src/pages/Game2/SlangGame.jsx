import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePartyContext } from "@/hooks/usePartyContext";

import Button from "@/components/Button";
import Input from "@/components/Input";
import PartyCode from "@/components/PartyCode";
import Instructions from "@/components/Instructions";
import SlangInstructions from "@/instructions/SlangInstructions";

// Frontend-only preview multiplayer using localStorage sync.
// Open multiple tabs to /test?player=Alice, /test?player=Bob to simulate players.

const GAME_CONFIG = {
  lives: 3,
  turnSeconds: 15, // spec: 5s per turn
  minWordLength: 3,
  bullshitThreshold: 0.4,
  voteWindowMs: 3000,
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SAMPLE_DICTIONARY = new Set(["drip", "lit", "sus", "swag", "gucci", "thicc", "gang"]);

function chooseStartingLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function formatWord(word) {
  return word.trim().toLowerCase();
}

function defaultSharedState() {
  return {
    players: [],
    words: [],
    lastLetter: chooseStartingLetter(),
    turnIndex: 0,
    turnStart: Date.now(),
    inVote: false,
    proposed: null, // { word, proposerId, votes: {id:true} , votingEnd }
    failCounts: {},
    gameOver: false,
    blackoutPlayerId: null,
  };
}

export default function SlangGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { partyCode, username: partyUsername } = usePartyContext();
  const instructionsRef = useRef(null);
  const isPreview = location.pathname === "/test";

  // preview player identity from querystring
  const params = new URLSearchParams(location.search);
  const previewName = params.get("player");
  const roomParam = params.get("room") || "TEST";
  const playerId = params.get("id") || `${previewName || partyUsername || "P"}_${Math.floor(Math.random() * 100000)}`;

  const stateKey = `slang-state-${roomParam}`;

  const [shared, setShared] = useState(() => {
    const raw = localStorage.getItem(stateKey);
    return raw ? JSON.parse(raw) : defaultSharedState();
  });

  const [currentInput, setCurrentInput] = useState("");
  const [feedback, setFeedback] = useState("Ready");

  // Helpers to read/write shared state (single source of truth stored in localStorage)
  function readShared() {
    try {
      const raw = localStorage.getItem(stateKey);
      return raw ? JSON.parse(raw) : defaultSharedState();
    } catch (e) {
      return defaultSharedState();
    }
  }

  function writeShared(next) {
    localStorage.setItem(stateKey, JSON.stringify(next));
    // update local component state
    setShared(next);
  }

  // Join flow: add this player to shared.players if missing (preview only)
  useEffect(() => {
    if (!isPreview && !partyCode) {
      navigate("/");
      return;
    }

    if (!isPreview) return; // normal app uses sockets

    // ensure a shared state exists
    let state = readShared();
    if (!state) state = defaultSharedState();

    const name = previewName || partyUsername || `Player${playerId.slice(-4)}`;
    const exists = state.players.find((p) => p.id === playerId);
    if (!exists) {
      state.players.push({ id: playerId, name });
      state.failCounts[playerId] = state.failCounts[playerId] || 0;
      // persist and notify other tabs via storage event
      writeShared({ ...state });
    } else {
      // sync local copy
      setShared(state);
    }

    // cleanup on unload: remove player
    function onUnload() {
      const s = readShared();
      s.players = s.players.filter((p) => p.id !== playerId);
      delete s.failCounts[playerId];
      // if the leaving player was before turnIndex, adjust
      if (s.turnIndex >= s.players.length) s.turnIndex = 0;
      writeShared(s);
    }

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []); // eslint-disable-line

  // storage event listener to sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== stateKey) return;
      try {
        const val = e.newValue ? JSON.parse(e.newValue) : defaultSharedState();
        setShared(val);
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Timer & vote watcher: run small interval to resolve votes and timeouts
  useEffect(() => {
    const iv = setInterval(() => {
      const s = readShared();
      if (!s) return;

      // Voting resolution
      if (s.inVote && s.proposed && s.proposed.votingEnd) {
        const now = Date.now();
        const playersCount = s.players.length;
        const otherCount = Math.max(0, playersCount - 1);
        const votes = s.proposed.votes ? Object.keys(s.proposed.votes).length : 0;
        const threshold = Math.ceil(GAME_CONFIG.bullshitThreshold * otherCount);

        if (votes >= threshold || now >= s.proposed.votingEnd) {
          // finalize vote
          if (votes >= threshold && otherCount > 0) {
            // rejected -> fail proposer
            s.failCounts[s.proposed.proposerId] = (s.failCounts[s.proposed.proposerId] || 0) + 1;
            s.inVote = false;
            s.proposed = null;
            // advance turn, chain continues from previous word
            s.turnIndex = (s.turnIndex + 1) % Math.max(1, s.players.length);
            s.turnStart = Date.now();
          } else {
            // accepted despite miss -> treat as accepted word
            s.words.push(s.proposed.word);
            s.lastLetter = s.proposed.word[s.proposed.word.length - 1].toUpperCase();
            s.inVote = false;
            s.proposed = null;
            s.turnIndex = (s.turnIndex + 1) % Math.max(1, s.players.length);
            s.turnStart = Date.now();
          }

          // check blackout
          for (const pid of Object.keys(s.failCounts || {})) {
            if (s.failCounts[pid] >= GAME_CONFIG.lives) {
              s.gameOver = true;
              s.blackoutPlayerId = pid;
            }
          }

          writeShared(s);
        }
      }

      // Turn timeout handling
      if (!s.inVote && s.players.length > 0) {
        const now = Date.now();
        const elapsed = Math.floor((now - (s.turnStart || 0)) / 1000);
        if (elapsed >= GAME_CONFIG.turnSeconds) {
          // timeout -> fail current player
          const current = s.players[s.turnIndex];
          if (current) {
            s.failCounts[current.id] = (s.failCounts[current.id] || 0) + 1;
            s.turnIndex = (s.turnIndex + 1) % Math.max(1, s.players.length);
            s.turnStart = Date.now();
          }
          // check blackout
          for (const pid of Object.keys(s.failCounts || {})) {
            if (s.failCounts[pid] >= GAME_CONFIG.lives) {
              s.gameOver = true;
              s.blackoutPlayerId = pid;
            }
          }
          writeShared(s);
        }
      }
    }, 250);
    return () => clearInterval(iv);
  }, []);

  // UI helpers
  const me = shared.players.find((p) => p.id === playerId) || { id: playerId, name: previewName || partyUsername || "Guest" };
  const activePlayer = shared.players[shared.turnIndex] || null;
  const isMyTurn = activePlayer && activePlayer.id === playerId && !shared.inVote && !shared.gameOver;
  const inVote = shared.inVote && shared.proposed;

  function proposeWord(word) {
    const s = readShared();
    if (s.gameOver) return;
    const formatted = formatWord(word);
    // basic checks
    if (formatted.length < GAME_CONFIG.minWordLength) {
      setFeedback(`Words must be at least ${GAME_CONFIG.minWordLength} letters.`);
      return;
    }
    if (s.words.includes(formatted)) {
      setFeedback("That word already appeared.");
      return;
    }
    if (s.words.length > 0 && formatted[0] !== (s.lastLetter || "").toLowerCase()) {
      setFeedback(`Wrong starting letter. Must start with ${s.lastLetter}`);
      return;
    }

    // dictionary check
    if (SAMPLE_DICTIONARY.has(formatted)) {
      // accepted
      s.words.push(formatted);
      s.lastLetter = formatted[formatted.length - 1].toUpperCase();
      s.turnIndex = (s.turnIndex + 1) % Math.max(1, s.players.length);
      s.turnStart = Date.now();
      writeShared(s);
      setFeedback("Accepted (dictionary hit)");
      setCurrentInput("");
      return;
    }

    // not in dictionary -> start vote
    s.inVote = true;
    s.proposed = { word: formatted, proposerId: playerId, votes: {}, votingEnd: Date.now() + GAME_CONFIG.voteWindowMs };
    writeShared(s);
    setFeedback("Word submitted — waiting for bullshit votes");
    setCurrentInput("");
  }

  function voteBullshit() {
    const s = readShared();
    if (!s.inVote || !s.proposed) return;
    if (s.proposed.proposerId === playerId) return; // proposer cannot vote
    s.proposed.votes = s.proposed.votes || {};
    s.proposed.votes[playerId] = true;
    writeShared(s);
    setFeedback("Voted bullshit");
  }

  function resetSharedRound() {
    const s = readShared();
    s.words = [];
    s.lastLetter = chooseStartingLetter();
    s.inVote = false;
    s.proposed = null;
    s.turnStart = Date.now();
    s.turnIndex = 0;
    s.failCounts = {};
    s.gameOver = false;
    s.blackoutPlayerId = null;
    writeShared(s);
  }

  // Submit handler bound to UI
  function handleSubmitWord() {
    // only allow submit if preview mode; in real app this would go to server
    if (!isPreview) return;
    const s = readShared();
    const active = s.players[s.turnIndex];
    if (!active || active.id !== playerId) {
      setFeedback("Not your turn");
      return;
    }
    if (s.inVote) {
      setFeedback("Voting in progress — wait");
      return;
    }
    proposeWord(currentInput);
  }

  function handleRestart() {
    if (!isPreview) return;
    resetSharedRound();
  }

  // compute remaining seconds for UI
  const remainingSecondsUI = (() => {
    const s = shared;
    if (!s.turnStart) return GAME_CONFIG.turnSeconds;
    const elapsed = Math.floor((Date.now() - s.turnStart) / 1000);
    const rem = Math.max(0, GAME_CONFIG.turnSeconds - elapsed);
    return rem;
  })();

  // compute voting info
  const votingInfo = shared.proposed ? { word: shared.proposed.word, proposerId: shared.proposed.proposerId } : null;

  // Circular player layout helper
  function playerStyle(i, total) {
    const angle = (i / total) * 360;
    const radius = 110; // px
    return {
      transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
    };
  }

  return (
    <main className="relative min-h-screen w-screen overflow-hidden bg-black text-white px-6 py-6">
      <Instructions ref={instructionsRef} instructions={SlangInstructions(GAME_CONFIG)} />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.9),transparent_40%,rgba(0,0,0,0.95))]" />

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 pb-12">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-white/20 bg-white/5 p-4 backdrop-blur-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/60">Slang! — Word Chain (Preview)</p>
            <h1 className="text-4xl font-bold uppercase tracking-tight">Keep the chain alive</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="light" onClick={() => instructionsRef.current?.showModal()} ariaLabel="Open instructions">
              Instructions
            </Button>
            <Button variant="danger" onClick={() => navigate("/room")} ariaLabel="Back to room">
              Back to room
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_1fr]">
          <div className="space-y-6 rounded-3xl border-2 border-white/20 bg-white/5 p-6 backdrop-blur-sm">
            <div className="rounded-3xl bg-white/5 p-5 text-white/90">
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">Party</p>
              <p className="mt-3 text-2xl font-semibold">{me.name}</p>
              <p className="mt-1 text-sm text-white/70">Room code: {roomParam}</p>
            </div>

            <div className="grid gap-4">
              <StatusTile label="Starting letter" value={shared.lastLetter} />
              <StatusTile label="Turn timer" value={`${remainingSecondsUI}s`} />
              <StatusTile label="Players" value={`${shared.players.length}`} />
              <StatusTile label="Fails (you)" value={`${shared.failCounts[me.id] || 0}`} />
            </div>
          </div>

          <div className="rounded-3xl border-2 border-white/20 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">Turn</p>
                <p className="mt-2 text-3xl font-bold text-white">{shared.gameOver ? "Game Over" : activePlayer ? `${activePlayer.name}'s turn` : "Waiting"}</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/70">
                {shared.words.length} word{shared.words.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-white/80">
                <p className="font-semibold text-white">Feedback</p>
                <p className="mt-3 text-sm leading-relaxed">{feedback}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <Input
                  type="text"
                  placeholderText={`Start with ${shared.lastLetter || "?"}`}
                  onChange={setCurrentInput}
                  className="text-black"
                  value={currentInput}
                />
                <Button
                  variant="dark"
                  onClick={handleSubmitWord}
                  ariaLabel="Submit word"
                  disabled={!isMyTurn || shared.inVote || shared.gameOver}
                >
                  Submit
                </Button>
              </div>

              {/* Bullshit vote button for others when a proposal exists */}
              {inVote && shared.proposed && shared.proposed.proposerId !== me.id && (
                <div className="flex gap-2">
                  <Button variant="danger" onClick={voteBullshit} ariaLabel="Bullshit">
                    Bullshit
                  </Button>
                  <div className="flex items-center gap-2 pl-4">
                    <p className="text-sm">Proposed: <span className="font-bold">{shared.proposed.word}</span></p>
                    <p className="text-sm">Votes: {Object.keys(shared.proposed.votes || {}).length}</p>
                  </div>
                </div>
              )}

              {shared.gameOver && shared.blackoutPlayerId && (
                <div className="rounded-3xl border border-red-500 bg-red-900/30 p-4 text-center">
                  <p className="text-xl">{shared.players.find(p => p.id === shared.blackoutPlayerId)?.name} has blacked out!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-white/20 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">Word chain</p>
              <p className="mt-2 text-2xl font-semibold">Current history</p>
            </div>
            <div className="flex gap-2">
              <Button variant="light" onClick={() => resetSharedRound()} ariaLabel="Reset round">Reset round</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {shared.words.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-center text-white/70">
                No words yet. Drop the first slang word to start the chain.
              </div>
            ) : (
              shared.words.map((word, index) => (
                <WordListItem key={`${word}-${index}`} index={index + 1} word={word} />
              ))
            )}
          </div>

          <div className="mt-8 relative h-56">
            {/* Circular player ring */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/10 flex items-center justify-center">
              {shared.players.map((p, i) => (
                <div key={p.id} className={`absolute flex flex-col items-center gap-1 w-28`} style={playerStyle(i, shared.players.length)}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${activePlayer?.id === p.id ? 'border-white' : 'border-white/20'}`}>
                    <span className="font-bold">{p.name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-white/70">{p.name}</div>
                  <div className="text-xs text-white/60">Fails: {shared.failCounts[p.id] || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <PartyCode partyCode={roomParam} isCompact={true} position="br" />
    </main>
  );
}

function StatusTile({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm uppercase tracking-[0.35em] text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function WordListItem({ index, word }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-white">
      <span className="text-sm uppercase tracking-[0.35em] text-white/50">#{index}</span>
      <span className="text-xl font-bold uppercase tracking-tight">{word}</span>
    </div>
  );
}
