# Afterhours Backend

FastAPI and Socket.IO server. Handles rooms, sessions, and the game engines.

## Running the Backend

### With Docker (recommended)

From the project root, the folder containing `docker-compose.yml`:

```
docker compose up --build
```

That starts MySQL, the backend, and the frontend. To run just the database and backend, name them:

```
docker compose up --build db backend
```

The backend waits for MySQL to report healthy before it starts, so there is no connection race on a cold boot. Full Docker instructions are in the root `README.md`.

### Without Docker

Needs Python 3.14 and a local MySQL 8.4 server. From `backend/`:

```
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

Slang will not start without a MySQL database holding its word list. See `Games/Game1/GameEngine/README.md` for that setup.

The server runs on port **8000** either way.

---

## Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI 0.138 |
| ASGI Server | Uvicorn 0.49 |
| Real-time | python-socketio 5.16 (AsyncServer, ASGI mode) |
| Data Validation | Pydantic v2 |
| Database | MySQL 8.4 via mysql-connector-python |
| Runtime | Python 3.14 |

FastAPI and Socket.IO share a single port through a combined ASGI app: `socketio.ASGIApp(sio, fastapi_app)`.

---

## Directory Structure

```
backend/
├── Dockerfile               # Builds the backend image
├── .dockerignore
├── main.py                  # App entrypoint. Wires FastAPI, Socket.IO, CORS, env vars
├── GameRoom.py              # Per-room state machine
├── requirements.txt
├── tests_backend.py         # Backend API tests
│
├── db/
│   ├── 01_schema.sql        # Terms, Categories, Term_Category, Logs_table
│   └── 02_words.sql         # Slang starter word list as INSERT statements
│
├── api/
│   └── rooms.py             # FastAPI HTTP route definitions
│
├── schemas/
│   └── rooms.py             # Pydantic request body models
│
├── service/
│   ├── room_service.py      # Business logic for room operations
│   ├── session_service.py   # In-memory session and cookie management
│   └── session_registry.py  # SID to username to room_code mapping
│
├── sockets/
│   └── handlers.py          # Socket.IO event handler registration
│
└── Games/
    ├── BaseGameEngine.py    # Abstract template for game engines
    ├── Game1/
    │   └── GameEngine/
    │       ├── slangengine.py       # Slang! engine
    │       ├── playerclass.py       # SlangPlayer model (fails, eliminated)
    │       ├── word_bank.py         # MySQL-backed word database
    │       ├── slang_words.csv      # Source word list for db/02_words.sql
    │       ├── conftest.py          # Shared pytest fixtures
    │       ├── test_slangengine.py
    │       ├── test_word_bank.py
    │       └── play_test.py         # Terminal playtesting tool
    └── Game2/
        ├── GameEngine/
        │   ├── CrashOutEngine.py    # Crash Out engine
        │   └── PlayerClass.py       # Player model (score, bet, gain)
        └── Game 2 Client/           # Node.js CLI test clients, dev only
            ├── UnifiedClient.js     # Most complete test client
            ├── CrashGameClass.js    # Client-side game state class
            ├── Game_Client.js       # Earlier host-only client
            └── Room_Client.js       # Room management only
```

The SQL files in `db/` are mounted into the MySQL container and run automatically on its first boot. They are not used when running without Docker.

---

## HTTP API

All routes are in `api/rooms.py`. Session auth uses an `ah_session` HTTP-only cookie.

| Method | Path | Description |
|---|---|---|
| `GET` | `/status` | Health check |
| `GET` | `/session` | Create or validate a session cookie |
| `POST` | `/room_status` | Check if a username is in a given room. Returns player list |
| `POST` | `/create_room` | Generate a 4-char room code, create a `GameRoom`, add caller as host |
| `POST` | `/join_room` | Join a room by code. Emits `player_joined` |
| `POST` | `/leave_room` | Leave a room. Emits `player_left`, deletes the room if empty |
| `POST` | `/kick_player` | Host only. Emits `player_left` to the room and `kicked` to the target |
| `POST` | `/select_game` | Host only. Sets the active game, emits `lobby_update` |
| `POST` | `/start_game` | Host only. Launches the game engine loop |
| `POST` | `/game_event` | Send a game action over HTTP. Routes to the active engine |

---

## Request Schemas (`schemas/rooms.py`)

```python
RoomData          # username, code (optional), sid (optional)
GameEvent         # username, code, event_type, data (dict)
RoomGameRequest   # code, game_id (optional)
KickPlayerData    # sid (actor), code, targetUsername
```

---

## Socket.IO Events

**Received from clients:**

| Event | Handler | Action |
|---|---|---|
| `connect` | `handlers.py` | Logs the connection |
| `disconnect` | `handlers.py` | Removes the player, emits `player_left`, clears the session |
| `game_action` | `handlers.py` | Routes `{event_type, data}` to the active engine, broadcasts the result |

**Emitted to clients:**

| Event | Target | When |
|---|---|---|
| `player_joined` | Room broadcast | A player joins |
| `player_left` | Room broadcast | A player leaves or is kicked |
| `kicked` | Target SID only | A player is kicked by the host |
| `lobby_update` | Room broadcast | Host selects a game |
| `game_update` (`START_GAME`) | Room broadcast | Game engine starts |
| `game_update` (`PHASE_CHANGE`) | Room broadcast | Game phase transitions |
| `game_update` (`END_GAME`) | Room broadcast | Game concludes |

---

## State Management

Room and session state is held in memory and is lost when the server restarts. The only persisted data is Slang's word list and candidate log, which live in MySQL.

| Store | Location | Contents |
|---|---|---|
| `SESSIONS` dict | `service/session_service.py` | `session_token → {username, room_code, role}` |
| `active_rooms` dict | `service/room_service.py` | `room_code → GameRoom` |
| `sid_to_rooms` dict | `service/session_registry.py` | `socket_sid → room_code` |
| `sid_to_username` dict | `service/session_registry.py` | `socket_sid → username` |

Session tokens are `secrets.token_urlsafe(32)` values stored in the `ah_session` cookie.

---

## GameRoom (`GameRoom.py`)

Tracks the state of a single party room:

```python
class GameRoom:
    room_code: str
    players: List[str]
    host: str
    state: RoomStates   # EMPTY | WAITING | PLAYING
    game: Games         # NOT_SELECTED | SLANG | CRASH
    active_engine: Any  # The running engine instance
```

---

## Game Engines (`Games/`)

`BaseGameEngine.py` defines the expected interface: `start()`, `run_game_loop()`, `handle_event()`, `broadcast_phase_change()`, `end_game()`.

**Slang!** (`Games/Game1/GameEngine/slangengine.py`) is a turn-based word chain game with a group vote on unrecognized words. It is the only engine backed by the database. See its own README for the schema, the candidate review flow, and how to playtest it from the terminal.

**Crash Out** (`Games/Game2/GameEngine/CrashOutEngine.py`) runs a 5-round betting game:

1. **BETTING** (8s). Players call `place_bet` via `game_action`.
2. **PLAYING**. The server broadcasts a seed, start time, and step interval, and clients animate a synchronized multiplier.
3. **BLAST OFF**. The server crashes the multiplier and validates client cashout claims within a 0.5 tolerance.
4. **Scoring**. Players at or below 0 receive a punishment and are revived with 10 points.

Player model (`PlayerClass.py`): `name`, `score` (starts at 50), `bet`, `gain`.

---

## Slang! Engine (`Games/Game1/GameEngine/slangengine.py`)

`SlangEngine` is the turn-based word-chain engine. Each word must start with the last letter of the previous accepted word, be at least 3 letters, and be submitted within the turn clock. Words already in the database pass automatically; unrecognized words go to a group "bullsh*t" vote.

### Rules

- Each word must start with the last letter of the previous word.
- Minimum word length is 3 letters (`MIN_WORD_LENGTH`).
- 15 seconds to submit a word (`TURN_SECONDS`); running out of time costs a life.
- Words found in the word bank pass automatically with no vote.
- Unknown words are put to a bullsh*t vote (`VOTE_SECONDS`, default 15s).
- If at least 40% of eligible voters vote bullsh*t (`VOTE_THRESHOLD_PERCENT`), the submitter loses a life.
- Losing a life ends the current round.
- Turn order is random in the first round, then a fixed rotation in later rounds.
- Each player starts with 3 lives (`STARTING_LIVES`); first to lose all three is the loser.
- If drinking is enabled, a player drinks after each lost life (a `DRINKING_PAUSE_SECONDS` beat holds before the next round).

### Tunable Parameters

Class-level constants on `SlangEngine`, adjustable for testing:

| Constant | Default | Purpose |
|---|---|---|
| `MINIMUM_PLAYERS` | `2` | Players required to run the game |
| `STARTING_LIVES` | `3` | Lives per player before elimination |
| `TURN_SECONDS` | `15` | Time to submit a word before timeout |
| `VOTE_SECONDS` | `15` | Time a bullsh*t vote stays open |
| `VOTE_THRESHOLD_PERCENT` | `40` | Percent of eligible voters needed to reject a word |
| `MIN_WORD_LENGTH` | `3` | Minimum accepted word length |
| `CATEGORY` | `"Slang Words"` | Word-bank category queried for validation |
| `DRINKING_PAUSE_SECONDS` | `4` | Pause after a life is lost before the next round |

### Phases

The engine drives clients through a `phase` field carried on `PHASE_CHANGE` broadcasts:

| Phase | Meaning |
|---|---|
| `seating` | Waiting for every player to `confirm_ready` |
| `turn` | A player is submitting a word, or a bullsh*t vote is open |
| `drinking` | A life was just lost; a short pause holds before the next round |
| `blackout` | A player was eliminated; final standings are sent |
| `game_over` | Game has ended |

### Turn Flow

Unlike Crash Out's polled clock, Slang! is turn-driven: `run_game_loop` only waits out the seating phase, then every transition is reactive from `handle_event` or a per-turn timeout watcher.

1. `start()` emits `START_GAME`, broadcasts the seating state, and spawns `run_game_loop`.
2. Each player sends `confirm_ready`. When all confirm, `_all_confirmed_event` fires and round 1 begins with a random seat.
3. `_advance_to_next_turn` bumps `_turn_id`, broadcasts turn state, and starts `_turn_timeout_watch`. A `_turn_id` mismatch lets stale timeout watchers no-op once a turn resolves early.
4. On `submit_word` the engine validates length and the required starting letter, then:
   - If the word is in the bank, it is accepted instantly, appended to `chain`, and the turn advances.
   - Otherwise `pending_word` is set and `_vote_timeout_watch` starts the bullsh*t vote.
5. Other players send `vote_bullshit`. If votes reach `_votes_needed()` (based on `VOTE_THRESHOLD_PERCENT` of everyone but the submitter), the submitter loses a life. If the vote times out, the word survives, is logged as a candidate via `word_bank.add_candidate`, and the turn advances.
6. `_lose_life` records the loss, enters `drinking`, pauses `DRINKING_PAUSE_SECONDS`, and either eliminates the player (`_broadcast_blackout` then `end_game`) or starts the next round.

### Player-Driven Events

Routed through `handle_event(username, event_type, data)`, which returns `(ok, message, private_payload, broadcast_payload)`:

| `event_type` | Handler | Action |
|---|---|---|
| `confirm_ready` | `_handle_confirm_ready` | Marks the player ready during seating; unblocks the loop when all confirm |
| `submit_word` | `_handle_submit_word` | Validates and accepts a word, or opens a bullsh*t vote |
| `vote_bullshit` | `_handle_vote_bullshit` | Records a vote; may reject the word and cost a life |
| `chat_message` | `_handle_chat_message` | Broadcasts a non-empty chat message |

### Broadcasts

All game state reaches clients as `game_update` events:

- `START_GAME`  game name, `starting_lives`, and `turn_order`.
- `PHASE_CHANGE`  per-phase payloads. The `turn` payload includes `currentPlayer`, `previousWord`, `requiredLetter`, per-player `fails`, `timeLeft`, and live vote counts (`pendingWord`, `voteCount`, `votesNeeded`, `votedPlayers`).
- `END_GAME`  sent when the game concludes.

### Membership Changes

`add_player` and `remove_player` keep `turn_order`, `confirmed`, and `votes` consistent mid-game. Removing the current turn player cancels the turn timer, and removing a pending submitter clears the open vote so the game does not stall.

Slang! is the only engine backed by MySQL. See `Games/Game1/GameEngine/README.md` for the word-bank schema, the candidate review flow, and how to playtest it from the terminal.

---

## Configuration

Read in `main.py`:

| Variable | Default | Purpose |
|---|---|---|
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Comma-separated allowed CORS and Socket.IO origins |
| `COOKIE_SECURE` | `false` | Require HTTPS for the session cookie |
| `COOKIE_SAMESITE` | `lax` | SameSite policy for the session cookie |

Read in `Games/Game1/GameEngine/word_bank.py`, used by Slang:

| Variable | Default | Purpose |
|---|---|---|
| `MYSQL_HOST` | `localhost` | MySQL server host |
| `MYSQL_USER` | `afterhours` | App database user |
| `MYSQL_PASSWORD` | `afterhours_dev` | App database password |
| `MYSQL_DATABASE` | `cp476_afterhours` | Database name |
| `MYSQL_PORT` | `3306` | MySQL port |

Under Docker these are set in `docker-compose.yml`. Note that `MYSQL_HOST` is `db` there, the name of the database service, not `localhost`.