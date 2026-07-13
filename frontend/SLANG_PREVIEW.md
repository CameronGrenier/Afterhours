Slang Game Preview — Frontend Only for now

- A lightweight frontend-only preview of the Slang! (word chain) game.

How to run the preview

Start the frontend dev server:

```bash
cd frontend
npm install
npm run dev
```
Open the preview in one or more browser tabs:

- Single player: http://localhost:5173/test
- Multi-tab multiplayer preview (simulate players)
    Example:
  - Tab A: http://localhost:5173/test?player=Alice
  - Tab B: http://localhost:5173/test?player=Bob
  - Tab C: http://localhost:5173/test?player=Carol

Notes:
The preview stores shared state in `localStorage` under the key `slang-state-<room>` (room defaults to `TEST`).
Only the active player (whose turn it is) can submit a word; other tabs can press "Bullshit" for votes.
Timer is 15 seconds per turn in the preview; votes resolve after ~3s.

Files changed by this work

`frontend/src/pages/Game2/SlangGame.jsx`  
`frontend/src/pages/test/TestPage.jsx`     
`frontend/src/components/Input.jsx`       

