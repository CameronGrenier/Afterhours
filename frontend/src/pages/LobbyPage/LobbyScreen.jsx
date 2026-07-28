import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Undo2, Trophy, Crown, X, Medal } from "lucide-react";
import { leaveRoom } from "@/api/room.js"
import { usePartyContext } from "@/hooks/usePartyContext.js";

import PartyCode from "@/components/PartyCode";
import Button from "@/components/Button";
import MembersPanel from "../../components/MembersPanel";
import { useToast } from "@/hooks/useToast";

/**
 * LobbyScreen
 *
 * The waiting room shown after a user joins a party. It displays:
 *   - A "Members" panel listing everyone currently in the party.
 *   - The party code, plus Start / Leave actions.
 *   - An ambient visualization of the roster:
 *       • Desktop → names arranged along an inward-winding spiral (PlayersDisplay).
 *       • Mobile  → the spiral is skipped (too cramped to read); instead an
 *                   app-wide info toast announces the join (see useToast).
 *
 * @param {object}   props
 * @param {{width:number,height:number}} props.dimensions - Measured size of the
 *        parent container, used to lay out the spiral. Comes from App's ResizeObserver/ref.
 * @param {string}   props.partyCode        - The shareable party code.
 * @param {string}   props.username         - The current user's (PascalCase) name.
 * @param {string[]} props.players          - All player names in the party.
 * @param {boolean}  props.isMobile         - True on small/short viewports.
 * @param {boolean}  props.isHost           - Flag if the user is the host of the lobby
 * @param {Function} props.handleStartRoom  - Begins the game.
 * @param {Function} props.handleLeave     - Leaves the lobby, returns home.
 * @param {Function} props.handleKickPlayer - Kicks specified player
 */
export default function LobbyScreen({
  dimensions,
  isMobile,
}) {

  const navigate = useNavigate();
  const { sid, info, partyCode, username, players, isHost, setIsHost, setScreen, handleKickPlayer, leaderboard, setLeaderboard} = usePartyContext();
  const { width, height } = dimensions;

  // Navigation on game start is handled centrally by PartyProvider's
  // `lobby_update` listener, which routes players to the correct game route
  // based on the selected game. A hardcoded `game_update`/START_GAME ->
  // navigate("/slang") here used to override that and drag everyone into
  // Slang even when the host picked Crash Out.

  /**
  * Starts the room by navigating to /room with the state it needs.
  */
  function handleStartRoom() {
    navigate("/room");
  }
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      setShowLeaderboard(true);
    }
  }, [leaderboard]);

  function handleCloseLeaderboard(){
    setLeaderboard([])
    setShowLeaderboard(false)

  }

  /**
   * Leaves the current room and returns to the join screen. Notifies the server
   * so the player is removed and other clients receive an updated player list.
   */
  function handleLeave() {
    setIsHost(false);
    leaveRoom(sid, partyCode, username);
    navigate("/")
  }


  // The spiral is a desktop-only flourish. On mobile we skip the (relatively
  // expensive) layout math entirely — `positions` stays null and we announce
  // the join with a toast instead.
  const positions = isMobile
    ? null
    : spiralPositions(players, width, height, {
        rMin: 0.6,
        turns: 2,
        slots: 10,
        fit: 0.9,
      });

  // Mobile stand-in for the spiral: announce the join via a top-center toast.
  useEffect(() => {
    if (isMobile) info(`${username} has joined!`);
  }, [isMobile, username, info]);

  return (
    <>
      {/* Roster list — always available, on every breakpoint. */}
      <MembersPanel/>

      {/* Ambient roster visualization (desktop only; mobile uses a toast). */}
      {!isMobile && <PlayersDisplay positions={positions} />}

      {/* Radial scrim: darkens the center so foreground UI stays legible
          over the spiral / background. Sits above the spiral (z-2) but below
          the interactive content (z-3). */}
      <div className="absolute top-0 left-0 w-full h-full z-[3] bg-radial from-black/80 to-black/10" />

      {/* Primary content column: title + party code + actions. */}
      <div className="w-full max-w-[400px] flex flex-col gap-4 opacity-100 z-[3]">
        <h1 className="text-4xl font-bold text-white font-display uppercase text-center leading-none">
          afterhours
        </h1>
        <div className="flex flex-col gap-3">
          <PartyCode partyCode={partyCode} isCompact={false} />
          <Button variant={"dark"} disabled={!isHost} onClick={() => handleStartRoom()}>
            {isHost? <p>Start</p> : <p>Waiting for Host</p>}
          </Button>
          {/* Return to home screen. */}
          <Button variant="danger" onClick={() => handleLeave()}>
            <div className="flex gap-2 items-center w-fit mx-auto">
              <Undo2 size={20} strokeWidth={3.2} />
              <span>Leave</span>
            </div>
          </Button>
        </div>
      </div>
      {showLeaderboard && leaderboard && leaderboard.length > 0 && (
        <LeaderboardModal
          leaderboard={leaderboard}
          onClose={handleCloseLeaderboard}
        />
      )}
    </>
  );
}

function LeaderboardModal({ leaderboard = [], onClose }) {
  const first = leaderboard[0] || "";
  const second = leaderboard[1] || "";
  const third = leaderboard[2] || "";

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-6">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20 mb-1">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-white">
            Match Results
          </h2>
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">
            Leaderboard
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <div className="flex items-center gap-4 p-3.5 bg-gradient-to-r from-yellow-500/20 to-neutral-900 border border-yellow-500/40 rounded-2xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-black font-bold font-display text-lg">
              1
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                <Crown size={12} /> Winner
              </p>
              <p className="text-lg font-bold text-white truncate font-display">
                {first}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3.5 bg-neutral-800/60 border border-neutral-700/50 rounded-2xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-black font-bold font-display text-lg">
              2
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Medal size={12} /> 2nd Place
              </p>
              <p className="text-base font-bold text-white truncate font-display">
                {second}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3.5 bg-neutral-800/40 border border-neutral-800 rounded-2xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/80 text-white font-bold font-display text-lg">
              3
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <Medal size={12} /> 3rd Place
              </p>
              <p className="text-base font-bold text-white truncate font-display min-h-[1.5rem]">
                {third}
              </p>
            </div>
          </div>
        </div>
        <Button variant="dark" onClick={onClose}>
          Continue
        </Button>
      </div>
    </div>
  );
}

/**
 * PlayersDisplay (desktop)
 *
 * Renders each player's name at its precomputed spiral position. Pure
 * presentational component — all geometry/color is decided in spiralPositions.
 *
 * @param {object} props
 * @param {{player:string,x:number,y:number,rotationDeg:number,hue:number,fontSize:number}[]} props.positions
 */
function PlayersDisplay({ positions }) {
  return (
    <div className="absolute top-0 left-0 w-full h-full z-[2]">
      {positions.map(({ player, x, y, rotationDeg, hue, fontSize }) => (
        <div
          key={player}
          className="absolute whitespace-nowrap font-display tracking-tight leading-none transition-colors duration-400"
          style={{
            left: x,
            top: y,
            // translate(-50%,-50%) centers the label ON its (x,y) anchor;
            // rotate aims it relative to the center (see spiralPositions).
            transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
            color: `hsl(${hue} 95% 57%)`,
            fontSize: `${fontSize}rem`,
          }}
        >
          {player}
        </div>
      ))}
    </div>
  );
}

/**
 * spiralPositions
 *
 * Lays out player labels along an Archimedean spiral (r = a + b·θ) that winds
 * inward toward the container's center.
 *
 * Why this approach:
 *  - Archimedean spiral → radius grows linearly with the winding angle θ, so
 *    successive turns are evenly spaced.
 *  - We parameterize by ARC LENGTH (distance travelled along the curve), not by
 *    angle. Equal steps in angle are NOT equal distances on a spiral (a fixed
 *    Δθ covers almost nothing near the center and a lot far out). Walking by
 *    arc length gives even spacing AND guarantees consecutive turns never land
 *    on the same compass direction — so labels never form straight "spokes."
 *  - Slots are FIXED (default 10 = max party size). We always compute the same
 *    10 evenly-spaced positions and fill the first players.length of them, so a
 *    player keeps its spot as others come and go.
 *
 * Mapping note: x scales by W/2 and y by H/2 independently (an ellipse), i.e.
 * the spiral stretches to fill a non-square box rather than staying circular.
 *
 * @param {string[]} players       - Names; each becomes one label.
 * @param {number}   W             - Container width (px).
 * @param {number}   H             - Container height (px).
 * @param {object}   [opts]
 * @param {number}   [opts.rMin=0.2] - Inner radius as a fraction of half-extent (0–1).
 * @param {number}   [opts.turns=3]  - Full revolutions from inner to outer radius.
 * @param {number}   [opts.slots=10] - Fixed count of evenly-spaced positions.
 * @param {number}   [opts.fit=0.9]  - Margin (<1) so outer labels don't clip the edge.
 * @returns {{player:string,x:number,y:number,rotationDeg:number,hue:number,fontSize:number}[]}
 */
function spiralPositions(players, W, H, opts = {}) {
  const { rMin = 0.2, turns = 3, slots = 10, fit = 0.9 } = opts;

  // Spiral constants. θ is the cumulative winding angle (radians), unbounded
  // and climbing; r grows with it. a = inner radius, b = how fast r grows per
  // radian (derived so r reaches 1 exactly after `turns` revolutions).
  const a = rMin;
  const thetaMax = turns * 2 * Math.PI;
  const b = (1 - a) / thetaMax;

  // Arc length from the start to angle t (closed-form for r ≈ a + b·θ), the
  // total track length S, and the even spacing ds between the fixed slots.
  const sOf = (t) => a * t + (b / 2) * t * t;
  const S = sOf(thetaMax);
  const ds = S / slots;

  // Center, and per-axis half-extents (the ellipse / stretch-to-fill).
  const cx = W / 2;
  const cy = H / 2;
  const Rx = (fit * W) / 2;
  const Ry = (fit * H) / 2;

  return players.map((player, k) => {
    // Walk inward: slot 0 sits near the OUTER rim, later slots toward center.
    // The +0.5 centers each label within its slot (keeps it off the dead
    // center and off the very rim).
    const s = (slots - 0.5 - k) * ds;

    // Invert arc length → winding angle, then read radius and (x, y).
    const theta = (-a + Math.sqrt(a * a + 2 * b * s)) / b;
    const r = a + b * theta; // already normalized to [rMin, 1]
    const x = cx + r * Rx * Math.cos(theta);
    const y = cy + r * Ry * Math.sin(theta);

    // Orientation: aim the label's BOTTOM at the center. We use the real
    // screen-space vector to the center (not theta) so it stays correct under
    // the ellipse stretch. Labels in the lower half get flipped 180° so their
    // TOP points to center instead — that keeps text upright on both sides.
    let rotationDeg = (Math.atan2(cy - y, cx - x) * 180) / Math.PI - 90;
    if (y > cy) rotationDeg += 180;

    // Size ramps with radius: outermost names largest, innermost smallest.
    // t is 0 at the inner radius, 1 at the outer; lerp 1.25rem → 3rem.
    const t = (r - a) / (1 - a);
    const fontSize = 1.25 + t * (3 - 1.25);

    // NOTE: Math.random() runs on every render, so each player's hue reshuffles
    // whenever this component re-renders (e.g. roster changes). Combined with
    // `transition-colors` above, that makes colors visibly drift on re-render.
    // For stable per-player colors, derive the hue from the name or memoize it.
    const hue = Math.random() * 360;
    return { player, x, y, rotationDeg, hue, fontSize };
  });
}
