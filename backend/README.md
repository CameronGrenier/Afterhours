# Afterhours Backend

## Running the Backend

- Highly recommended to use PyCharm for testing this terminal prototype.
- Create and activate a virtual environment:
  - `source .venv/bin/activate` on Mac and Linux
  - `.venv\Scripts\activate` on Windows
- Install dependencies:
  - `pip install -r requirements.txt`
- Start the server:
  - `uvicorn main:app --reload`

The server runs on port **8000** by default.

---

## Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI 0.138 |
| ASGI Server | Uvicorn 0.49 |
| Real-time | python-socketio 5.16 (AsyncServer, ASGI mode) |
| Data Validation | Pydantic v2 |
| Runtime | Python 3.14 |

FastAPI and Socket.IO share a single port via a combined ASGI app: `socketio.ASGIApp(sio, fastapi_app)`.

---

## Directory Structure

```
backend/
├── main.py                  # App entrypoint — wires FastAPI, Socket.IO, CORS, env vars
├── GameRoom.py              # GameRoom class — per-room state machine
├── requirements.txt         # Python dependencies
│
├── api/
│   └── rooms.py             # All FastAPI HTTP route definitions
│
├── schemas/
│   └── rooms.py             # Pydantic request body models
│
├── service/
│   ├── room_service.py      # Core business logic for all room operations
│   ├── session_service.py   # In-memory session/cookie management
│   └── session_registry.py  # SID ↔ username ↔ room_code mapping for sockets
│
├── sockets/
│   └── handlers.py          # Socket.IO event handler registration
│
└── Games/
    ├── BaseGameEngine.py    # Abstract template class for game engines
    └── Game2/
        ├── GameEngine/
        │   ├── CrashOutEngine.py   # "Crash Out" game engine (fully implemented)
        │   └── PlayerClass.py      # Player data model (score, bet, gain)
        └── Game 2 Client/          # Node.js CLI test clients (dev only)
            ├── UnifiedClient.js    # Most complete test client
            ├── CrashGameClass.js   # Client-side game state class
            ├── Game_Client.js      # Earlier host-only client
            └── Room_Client.js      # Room-management-only client
```

---

## HTTP API

All routes are defined in `api/rooms.py`. Session auth uses an `ah_session` HTTP-only cookie.

| Method | Path | Description |
|---|---|---|
| `GET` | `/status` | Health check |
| `GET` | `/session` | Create or validate a session cookie |
| `POST` | `/room_status` | Check if a username is in a given room; returns player list |
| `POST` | `/create_room` | Generate a 4-char room code, create a `GameRoom`, add caller as host |
| `POST` | `/join_room` | Join an existing room by code; emits `player_joined` to room |
| `POST` | `/leave_room` | Leave a room; emits `player_left`; deletes room if empty |
| `POST` | `/kick_player` | Host only: remove a player; emits `player_left` to room and `kicked` to target |
| `POST` | `/select_game` | Host only: set the room's active game; emits `lobby_update` |
| `POST` | `/start_game` | Host only: launch the game engine async loop |
| `POST` | `/game_event` | Send a game action over HTTP (e.g., `get_score`); routes to active engine |

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
| `disconnect` | `handlers.py` | Removes player from room, emits `player_left`, clears session |
| `game_action` | `handlers.py` | Routes `{event_type, data}` to active game engine; broadcasts result |

**Emitted to clients:**

| Event | Target | When |
|---|---|---|
| `player_joined` | Room broadcast | A player joins |
| `player_left` | Room broadcast | A player leaves or is kicked |
| `kicked` | Target SID only | A player is kicked by the host |
| `lobby_update` | Room broadcast | Host selects a game |
| `game_update` (type `START_GAME`) | Room broadcast | Game engine starts |
| `game_update` (type `PHASE_CHANGE`) | Room broadcast | Game phase transitions (betting, playing, etc.) |
| `game_update` (type `END_GAME`) | Room broadcast | Game concludes |

---

## State Management

All state is in-memory, **no database**. Data is lost on server restart.

| Store | Location | Contents |
|---|---|---|
| `SESSIONS` dict | `service/session_service.py` | `session_token → {username, room_code, role}` |
| `active_rooms` dict | `service/room_service.py` | `room_code → GameRoom` |
| `sid_to_rooms` dict | `service/session_registry.py` | `socket_sid → room_code` |
| `sid_to_username` dict | `service/session_registry.py` | `socket_sid → username` |

Session tokens are `secrets.token_urlsafe(32)` values stored in the `ah_session` HTTP-only cookie.

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
    active_engine: Any  # CrashOutEngine instance when playing
```

---

## Game Engines (`Games/`)

`BaseGameEngine.py` defines the expected interface: `start()`, `run_game_loop()`, `handle_event()`, `broadcast_phase_change()`, `end_game()`.

**Crash Out** (`Games/Game2/GameEngine/CrashOutEngine.py`) is the only partially implemented engine. It runs a 5-round betting game:

1. **BETTING phase** (8s) players call `place_bet` via `game_action`
2. **PLAYING phase** server broadcasts a seed, start time, and step interval; clients animate a synchronized multiplier
3. **BLAST OFF** server crashes the multiplier; validates client cashout claims (±0.5 tolerance)
4. **Scoring** broke players (score ≤ 0) receive a punishment and are revived with 10 points

Player model (`PlayerClass.py`): `name`, `score` (starts at 50), `bet`, `gain`.

---

## Configuration

Environment variables read in `main.py`:

| Variable | Default | Purpose |
|---|---|---|
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Comma-separated allowed CORS + Socket.IO origins |
| `COOKIE_SECURE` | `false` | Require HTTPS for session cookie |
| `COOKIE_SAMESITE` | `lax` | SameSite policy for session cookie |
