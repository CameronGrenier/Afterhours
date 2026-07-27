# Afterhours Frontend

React app built with Vite. Talks to the backend over HTTP and Socket.IO.

## Running the Frontend

### With Docker (recommended)

From the project root, the folder containing `docker-compose.yml`:

```
docker compose up --build
```

That starts the database, backend, and frontend together. Full instructions are in the root `README.md`.

### Without Docker

Needs Node 24. From `frontend/`:

```
npm install
npm run dev
```

The backend must be running on port 8000 separately.

Either way the app is at **http://localhost:5173**.

Other scripts: `npm run build` for a production bundle, `npm run preview`, `npm run lint`.

---

## Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 (Vite plugin, no config file) |
| Real-time | Socket.IO Client v4 |
| Icons | Lucide React v1 |

No SSR. `@` is aliased to `./src` in `vite.config.js`.

---

## Directory Structure

```
frontend/
├── Dockerfile            # Builds the frontend image
├── .dockerignore
├── .env.development      # VITE_API_URL=http://localhost:8000
├── index.html            # SPA entry point
├── vite.config.js
├── eslint.config.js
├── public/               # Served at root: favicons, PWA manifest
└── src/
    ├── main.jsx          # App entry: providers, router, routes
    ├── index.css         # Tailwind base and CSS variables
    ├── api/              # Backend communication
    │   ├── client.js         # fetch wrapper and shared socket instance
    │   ├── room.js           # Room HTTP calls
    │   ├── game.js           # Game HTTP calls
    │   └── crashout.js       # Crash Out specific calls
    ├── assets/
    │   ├── fonts/            # Basenji, Space Grotesk
    │   ├── icons/
    │   ├── Images/           # WebP backgrounds
    │   └── music/            # LobbyMusic1-5.wav
    ├── components/       # Shared UI
    ├── hooks/            # Custom React hooks
    ├── instructions/     # Per-game instruction content
    ├── lib/audio/        # Audio engine
    ├── pages/
    │   ├── home/             # Landing flow
    │   ├── LobbyPage/        # Waiting room
    │   ├── room/             # Game selection
    │   ├── slang/            # Slang! game screen
    │   ├── crashOut/         # Crash Out game screen
    │   └── test/             # Component sandbox
    └── stores/           # liveMultiplierStore.js
```

---

## State Management

No external state library. State lives in React Context.

**`PartyProvider` / `PartyContext`** (`components/PartyProvider.jsx`) is the global store:
- `sid`, `isHost`, `partyCode`, `username`, `players[]`
- `screen` picks which sub-screen renders inside `/`
- `mode` is `"host"` or `"join"`
- `sfxVolume`, `musicVolume`
- `rotateDialogDismissed`, persisted to `localStorage`

**`CrashOutProvider` / `CrashOutContext`** holds Crash Out game state, consumed through `useCrashoutContext()`.

**`ToastProvider` / `ToastContext`** is a separate context for the imperative toast API.

**`lib/audio/`** uses module-level singletons with a manual pub/sub pattern for volume sync. Not React state.

**`stores/liveMultiplierStore.js`** holds the live Crash Out multiplier outside React so high-frequency updates do not re-render the tree.

---

## Pages

### Home (`pages/home/`)

The `/` route. Sub-screens switch on `screen` state rather than the URL.

| File | Screen | Description |
|---|---|---|
| `App.jsx` | coordinator | Owns socket seeding, background imagery, and `SettingsPanel`, then delegates to sub-screens |
| `HomeScreen.jsx` | `"home"` | Host button, party code input, Join button. Validates the code with `getRoomStatus()` |
| `JoinScreen.jsx` | `"join"` | Username entry. Routes to host or join logic based on `mode` |
| `Annotation.jsx` | n/a | Decorative SVG arrow and label used on HomeScreen |

### Lobby (`pages/LobbyPage/`)

Waiting room. Shows `MembersPanel`, the party code, and Start and Leave controls. On desktop, player names are arranged along an Archimedean spiral.

### Room (`pages/room/RoomPage.jsx`)

Swipe and drag carousel of game cards with rubber-banding at the edges and an 80px snap threshold. Hosts the `Instructions` modal. Navigates back to `/` on mount if `partyCode` is missing.

### Slang (`pages/slang/SlangPage.jsx`)

The Slang! game screen. Word entry, turn order, and the bullsh\*t vote UI.

### Crash Out (`pages/crashOut/CrashOut.jsx`)

The Crash Out game screen. Renders `CrashOutGame` inside `CrashOutProvider`.

---

## Components (`components/`)

| Component | Description |
|---|---|
| `PartyProvider.jsx` | Global state store and socket event listeners |
| `PartyContext.js` | `createContext(null)`, consumed via `usePartyContext()` |
| `CrashOutProvider.jsx` | Crash Out game state and socket handling |
| `CrashOutContext.js` | Context object for the above |
| `CrashOutGame.jsx` | Main Crash Out play surface |
| `RocketMultiplierGraph.jsx` | Animated multiplier curve |
| `Panel.jsx` | Collapsible panel anchored to any corner. Desktop 25% width, max 450px. Fullscreen below 1300px. Manages `inert` on siblings and focus when open |
| `MembersPanel.jsx` | Top-right panel listing players with host kick controls |
| `MemberItem.jsx` | Player row with a slide-in kick confirmation |
| `SettingsPanel.jsx` | Top-left panel with volume sliders and a compact party code |
| `GameCard.jsx` | Game card with background image, title, and info button |
| `Instructions.jsx` | Native `<dialog>` using `showModal()` for focus trapping. Paged content. Parallelogram layout on desktop, fullscreen on mobile |
| `Toast.jsx` | Toast system. `ToastProvider` manages a queue capped at 4. Variants: success, warning, error, info |
| `PartyCode.jsx` | Centered card mode and compact corner-fixed mode |
| `RotateDialog.jsx` | Prompts mobile landscape users to rotate. Dismissal persisted to `localStorage` |
| `Button.jsx` | Variants: dark, light, danger |
| `Input.jsx` | Styled text input |
| `Slider.jsx` | Volume slider |
| `Surface.jsx` | Card wrapper |
| `Arrow.jsx` | SVG arrow used by `Annotation` |

---

## Hooks (`hooks/`)

| Hook | Purpose |
|---|---|
| `usePartyContext` | Access `PartyContext` |
| `useCrashoutContext` | Access `CrashOutContext` |
| `useSocketEvent` | Subscribe to a Socket.IO event. Registers once per event name and uses a `useRef` to keep handlers fresh without resubscribing on re-render |
| `useMediaQuery` | Responsive breakpoint matching |
| `useToast` | Imperative toast API |

---

## API (`api/`)

The backend base URL comes from `VITE_API_URL` in `.env.development`, which is `http://localhost:8000`.

Under Docker this stays `localhost` rather than the `backend` service name, because the code runs in the browser on the host, not inside the Docker network. The backend publishes port 8000 to the host, so `localhost:8000` reaches it.

### HTTP

`api/client.js` exposes a `fetch` wrapper that always sends `credentials: "include"` for cookies and a JSON content type.

| Function | Endpoint | Purpose |
|---|---|---|
| `getRoomStatus(code, username)` | `POST /room_status` | Validate a party code |
| `createRoom(sid, username)` | `POST /create_room` | Create a room |
| `joinRoom(sid, code, username)` | `POST /join_room` | Join a room |
| `leaveRoom(sid, code, username)` | `POST /leave_room` | Leave a room |
| `kickPlayer(sid, code, target)` | `POST /kick_player` | Host kicks a player |
| `request("/session", {GET})` | `GET /session` | Establish or restore a session on mount |

### WebSocket

A single shared `socket` instance is exported from `api/client.js`. Subscriptions go through `useSocketEvent(event, handler)`.

| Event | Handler | Action |
|---|---|---|
| `connect` | `App.jsx` | Seeds `sid` into `PartyProvider` from `socket.id` |
| `player_joined` | `PartyProvider` | Updates `players[]` |
| `player_left` | `PartyProvider` | Updates `players[]` |
| `kicked` | `PartyProvider` | Warning toast, resets party state to the home screen |
| `lobby_update` | `PartyProvider` | Host selected a game |
| `game_update` | Game providers | Game start, phase change, and end events |

---

## Game Instructions (`instructions/`)

Each file exports an array of JSX pages rendered by the `Instructions` component.

| File | Game | Notes |
|---|---|---|
| `CrashOutInstructions.jsx` | Crash Out | 8 pages. Configurable `startingBalance` and `maxBet`. Includes a `MultiplierTrack` component |
| `SlangInstructions.jsx` | Slang! | 7 pages. Configurable `lives`, `turnSeconds`, `voteThreshold`, `minWordLength`. Includes `WordChain`, `Lives`, and `ThresholdBar` |
| `shared.jsx` | n/a | Shared building blocks: `Page`, `PageHeader`, `Heading`, `Lead`, `StepRow`, `OutlineBlock`, `FillBlock`, `LedgerRow` |