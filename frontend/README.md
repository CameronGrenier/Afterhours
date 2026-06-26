# Frontend

## Running the Frontend

- Install dependencies:
  - `npm install`
- Start the dev server:
  - `npm run dev`

The app runs on **http://localhost:5173** by default. The backend must also be running on port 8000.

Other scripts: `npm run build` (production bundle), `npm run preview`, `npm run lint`.

---

## Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 (via Vite plugin, no config file) |
| Real-time | Socket.IO Client v4 |
| Icons | Lucide React v1 |

Single Page Application (SPA) with no SSR. `@` is aliased to `./src` in `vite.config.js`.

---

## Directory Structure

```
frontend/
├── public/               # Static assets served at root (favicons, PWA manifest)
├── src/
│   ├── api/              # All backend communication (HTTP + Socket.IO)
│   ├── assets/           # Static files bundled by Vite
│   │   ├── fonts/
│   │   ├── icons/        # SVGs (e.g., KickPlayer.svg)
│   │   ├── Images/       # WebP backgrounds (topology variants, game card backgrounds)
│   │   ├── music/        # LobbyMusic1-5.wav
│   │   └── soundfx/      # ButtonDown.wav, ButtonUp.wav, KeyStroke.wav
│   ├── components/       # Shared/reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── instructions/     # Per-game instruction page content (JSX)
│   ├── lib/
│   │   └── audio/        # Audio engine (settings, player, sound catalog)
│   ├── pages/
│   │   ├── home/         # Landing flow (home → join → lobby screens)
│   │   ├── room/         # Game selection room
│   │   └── test/         # Component dev/testing sandbox
│   ├── index.css         # Global styles (Tailwind base + CSS variables)
│   └── main.jsx          # App entry: providers, router, route definitions
├── .env.development      # VITE_API_URL=http://localhost:8000
├── index.html            # SPA entry point (PWA-capable)
├── vite.config.js
└── eslint.config.js
```

---

## Routing

Defined in `main.jsx` with `BrowserRouter`:

| Path | Component | Purpose |
|---|---|---|
| `/` | `pages/home/App.jsx` | Landing and pre-game flow |
| `/room` | `pages/room/RoomPage.jsx` | Game selection room |
| `/test` | `pages/test/TestPage.jsx` | Dev sandbox |

Navigation within `/` is **not** URL-based. It uses a `screen` state string (`"home"` → `"join"` → `"lobby"`) managed in `PartyProvider`. Only the lobby → room transition uses `useNavigate()`.

---

## State Management

No external state library. State is managed with React Context:

**`PartyProvider` / `PartyContext`** (`components/PartyProvider.jsx`) is the single global store. It holds:
- `sid`, `isHost`, `partyCode`, `username`, `players[]`
- `screen` controls which sub-screen renders inside `/`
- `mode` `"host"` or `"join"`
- `sfxVolume`, `musicVolume`
- `rotateDialogDismissed` persisted to `localStorage`

**`ToastProvider` / `ToastContext`** separate context for the imperative toast API.

**`lib/audio/`** module-level singletons for the audio engine with a manual pub/sub pattern for reactive volume sync. Not React state.

---

## Pages

### Home (`pages/home/`)

The `/` route. Sub-screens are switched by `screen` state, not the URL.

| File | Screen | Description |
|---|---|---|
| `App.jsx` | (coordinator) | Owns socket seeding, background imagery, `SettingsPanel`, and delegates to sub-screens |
| `HomeScreen.jsx` | `"home"` | "Host" button, party code input, "Join" button. Validates code via `getRoomStatus()` |
| `JoinScreen.jsx` | `"join"` | Username entry. Routes to host or join logic based on `mode` |
| `LobbyScreen.jsx` | `"lobby"` | Waiting room. Shows `MembersPanel`, party code, Start/Leave. Desktop arranges player names along an Archimedean spiral |
| `Annotation.jsx` | — | Decorative SVG arrow + label used on HomeScreen |

### Room (`pages/room/RoomPage.jsx`)

The `/room` route. Renders a swipe/drag carousel (`GameCardCarousel`) of game cards with rubber-banding at edges and an 80px snap threshold. Hosts the `Instructions` modal. Guards on mount: navigates back to `/` if `partyCode` is gone.

---

## Components (`components/`)

| Component | Description |
|---|---|
| `PartyProvider.jsx` | Global state store and socket event listeners |
| `PartyContext.js` | `createContext(null)` consumed via `usePartyContext()` |
| `Panel.jsx` | Collapsible side panel anchored to any corner (`tl/tr/bl/br`). Desktop: 25% width, max 450px. Mobile (<1300px): fullscreen. Manages `inert` on siblings and focus when open |
| `MembersPanel.jsx` | Top-right `Panel` listing all players with host kick controls |
| `MemberItem.jsx` | Player row with a slide-in kick confirmation overlay |
| `SettingsPanel.jsx` | Top-left `Panel` with SFX/Music volume sliders and compact party code display |
| `GameCard.jsx` | Game card with background image, title, and info button |
| `Instructions.jsx` | Native `<dialog>` (`showModal()` for focus trap). Paged content with forward/back navigation. Parallelogram layout on desktop, fullscreen on mobile |
| `Toast.jsx` | Full toast system. `ToastProvider` manages a queue (max 4). CSS enter/exit transitions. Variants: `success`, `warning`, `error`, `info` |
| `PartyCode.jsx` | Two modes: centered card and compact corner-fixed display |
| `RotateDialog.jsx` | Full-screen prompt for mobile landscape users to rotate. Dismissed state persisted in context and `localStorage` |
| `Button.jsx` | Three variants: `dark`, `light`, `danger` |
| `Input.jsx` | Single styled text input |
| `Slider.jsx` | Volume slider for the settings panel |
| `Surface.jsx` | Card/surface wrapper |
| `Arrow.jsx` | SVG arrow renderer used by `Annotation` |

---

## API (`api/`)

Backend is at `http://localhost:8000` in dev (from `.env.development`) or `http://<hostname>:8000` as a prod fallback.

### HTTP (`api/client.js` → `api/room.js`)

A thin `fetch` wrapper (`request()`) that always sends `credentials: "include"` (cookies) and `Content-Type: application/json`.

| Function | Endpoint | Purpose |
|---|---|---|
| `getRoomStatus(code, username)` | `POST /room_status` | Validate a party code exists |
| `createRoom(sid, username)` | `POST /create_room` | Create a new room |
| `joinRoom(sid, code, username)` | `POST /join_room` | Join an existing room |
| `leaveRoom(sid, code, username)` | `POST /leave_room` | Leave a room |
| `kickPlayer(sid, code, target)` | `POST /kick_player` | Host kicks a player |
| `request("/session", {GET})` | `GET /session` | Establish/restore session on mount |

`api/game.js` exists but is currently empty.

### WebSocket (`socket.io-client`)

A single shared `socket` instance exported from `api/client.js`. The `useSocketEvent(event, handler)` custom hook handles subscriptions, it registers once per event name using a `useRef` trick to keep handlers fresh without resubscribing on re-render.

**Events listened to:**

| Event | Handler | Action |
|---|---|---|
| `connect` | `App.jsx` | Seeds `sid` into `PartyProvider` from `socket.id` |
| `player_joined` | `PartyProvider` | Updates `players[]` |
| `player_left` | `PartyProvider` | Updates `players[]` |
| `kicked` | `PartyProvider` | Shows warning toast, resets all party state to home screen |

---

## Game Instructions (`instructions/`)

Each file returns an array of JSX pages rendered by the `Instructions` component.

| File | Game | Pages |
|---|---|---|
| `CrashOutInstructions.jsx` | Crash Out | 8 pages. Configurable `startingBalance`, `maxBet`. Includes a `MultiplierTrack` component |
| `SlangInstructions.jsx` | Slang! | 7 pages. Configurable `lives`, `turnSeconds`, `voteThreshold`, `minWordLength`. Includes `WordChain`, `Lives`, `ThresholdBar` components |
| `shared.jsx` | — | Design-system building blocks shared across all instruction pages: `Page`, `PageHeader`, `Heading`, `Lead`, `StepRow`, `OutlineBlock`, `FillBlock`, `LedgerRow` |
