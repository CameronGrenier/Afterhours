import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'; 
import { usePartyContext } from '@/hooks/usePartyContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {selectGame}from '@/api/room'

// Background topology images with responsive variants
import topoLandscape from "@/assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "@/assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "@/assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "@/assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "@/assets/Images/topology_bg_images/topology-ultrawide.webp";

import { CircleArrowRight, CircleArrowLeft } from 'lucide-react';

import SettingsPanel from "@/components/SettingsPanel";
import MembersPanel from "@/components/MembersPanel";
import PartyCode from "@/components/PartyCode";
import GameCard from "@/components/GameCard";
import RotateDialog from '@/components/RotateDialog';
import Instructions from "@/components/Instructions";
import CrashOutInstructions from '@/instructions/CrashOutInstructions'
import SlangInstructions from '@/instructions/SlangInstructions'

import slangGameCardBg from "@/assets/Images/slang_gamecard_bg.webp"
import slangGameCardBgMobile from "@/assets/Images/slang_gamecard_bg_mobile.webp"
import crashoutGameCardBg from "@/assets/Images/crashout_gamecard_bg.webp"
import crashoutGameCardBgMobile from "@/assets/Images/crashout_gamecard_bg_mobile.webp"

// Carousel sizing. CARD_W and GAP are the single source of truth: the card
// width and the track's translate are both built from these so the slide
// step can never drift out of sync. GAP must match the track's inline gap.
const CARD_W = "clamp(300px,60vw,1200px)";
const GAP = "1rem";

// Game catalog. Driving the cards from an array lets the carousel clamp the
// index against the real count and keeps add/remove to a one-line change.
const GAMES = [
  { name: "Slang!", desktop: slangGameCardBg, mobile: slangGameCardBgMobile },
  { name: "Crash Out", desktop: crashoutGameCardBg, mobile: crashoutGameCardBgMobile },
];

export default function RoomPage() {
  const navigate = useNavigate();
  const { isMobile, partyCode, username, isHost, error } = usePartyContext();
  const isSmallScreen = useMediaQuery("(max-height: 500px), (max-width: 768px)");
  const isMobileLandscape = useMediaQuery("(orientation: landscape)") && isSmallScreen;
  const [instructionSet, setInstructionSet] = useState([]);

  useEffect(() => {
    if (!partyCode) {
      error("Party lost, returning to lobby");
      console.error("Party Code lost");
      navigate("/");
    }
  }, [])

  const instructionsRef = useRef();

  const handleInfo = (name) => {
    switch (name) {
      case "Slang!":
        setInstructionSet(SlangInstructions({ lives: 3, turnSeconds: 15, voteThreshold: 40, minWordLength: 3 }));
        instructionsRef.current?.showModal();
        break;
      case "Crash Out":
        setInstructionSet(CrashOutInstructions({ startingBalance: 1000, maxBet: 500 }));
        instructionsRef.current?.showModal();
        break;
      default:
        console.error("No instruction set found");
        setInstructionSet([]);
    }
  }

  async function handlePlay(name) {
    switch (name) {
      case "Slang!":
        navigate("/slang");
        break;
      case "Crash Out": {
        const response = await selectGame(partyCode, name);
        const status = response["status"];
        if (status === "codeError") {
          error(`Error: room does not exist`);
          return;
        }
        navigate("/crashout");
        break;
      }
      default:
        'No game route found for: ' + name;
    }
  }

  return (
    <main className='relative w-screen h-dvh grid grid-rows-[auto_minmax(0,1fr)] p-6 overflow-hidden'>

      <picture className="fixed inset-0 z-[0]">
        {/* Portrait orientation: tall screens */}
        <source
          media="(orientation: portrait)"
          srcSet={`${topoPortrait} 1x, ${topoPortrait2x} 2x`}
        />
        {/* Ultra-wide orientation: 21:9 aspect ratio and wider */}
        <source media="(min-aspect-ratio: 2/1)" srcSet={topoUltrawide} />
        {/* Default: landscape orientation */}
        <img
          src={topoLandscape}
          srcSet={`${topoLandscape} 1x, ${topoLandscape2x} 2x`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10"
        />
      </picture>

      {/* Base gradient overlay: diagonal from top-left to bottom-right */}
      <div className="fixed inset-0 bg-[linear-gradient(to_top_left,#000,70%,transparent)] z-[0]" />

      {/* Additional mobile-only gradients for better contrast */}
      {isMobile && (
        <>
          <div className="fixed inset-0 bg-[linear-gradient(to_top,transparent_80%,black)] z-[0]" />
          <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_90%,black)] z-[0]" />
        </>
      )}

      {isMobileLandscape && <RotateDialog />}

      <Instructions ref={instructionsRef} instructions={instructionSet}/>

      <header className='w-full flex justify-center items-center z-[3]'>
        <h1 className='text-3xl lg:text-4xl font-display uppercase text-white'>afterhours</h1>
      </header>

      <SettingsPanel/>
      <MembersPanel/>

      <div className='flex items-center justify-center w-full h-full min-w-0 z-[3]'>
        <GameCardCarousel handleInfo={handleInfo} handlePlay={handlePlay}/>
      </div>
      {!isSmallScreen && <PartyCode isCompact={true} position="br" partyCode={partyCode}/>}
    </main>
  );
}


function GameCardCarousel({ handleInfo, handlePlay }) {
  const { isMobile } = usePartyContext();

  const [index, setIndex] = useState(0);
  const lastIndex = GAMES.length - 1;

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(lastIndex, i + 1));

  // --- Drag-to-follow state ---
  // dragPx: live finger delta, applied on top of the index offset so the track
  //   follows the finger in real time.
  // isDragging: while true, the CSS transition is disabled so the track sticks
  //   to the finger instead of easing toward it.
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(null);

  const SNAP_THRESHOLD = 80; // px the finger must travel to commit to a slide

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  }

  function handleTouchMove(e) {
    if (touchStartX.current === null) return;
    let delta = e.touches[0].clientX - touchStartX.current;

    // Rubber-band: if dragging past the first/last card, halve the movement so
    // the edges feel resistant rather than freely pulling into empty space.
    if ((index === 0 && delta > 0) || (index === lastIndex && delta < 0)) {
      delta = delta / 3;
    }
    setDragPx(delta);
  }

  function handleTouchEnd() {
    if (dragPx <= -SNAP_THRESHOLD) next();
    else if (dragPx >= SNAP_THRESHOLD) prev();
    // Whether we committed or not, clear the live delta and re-enable the
    // transition so the track animates to its resting index position.
    setDragPx(0);
    setIsDragging(false);
    touchStartX.current = null;
  }

  return (
    <div className='h-full w-full max-h-[80%] flex flex-col gap-4 px-0 md:px-16 overflow-visible'>
      <div className="w-full flex justify-between">
        <p className='text-white text-3xl lg:text-4xl font-bold tracking-tight'>Choose a game.</p>
        { !isMobile &&
          <div className='flex gap-1'>
            <NavigationButton icon={CircleArrowLeft} size={40} onClick={prev} disabled={index === 0}/>
            <NavigationButton icon={CircleArrowRight} size={40} onClick={next} disabled={index === lastIndex}/>
          </div>
        }
      </div>

      {/* Viewport: fixed box that clips the track. The next card peeking past
          the right edge is what produces the "one full, one partial" look. */}
      <div
        className="relative w-full flex-1 min-h-0 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track: a flex row of all cards. Its resting position is the index
            offset; during a drag, dragPx is added so it follows the finger.
            The transition is off mid-drag and on for the release snap. */}
        <div
          className={`flex h-full ${isDragging ? "" : "transition-transform duration-500 ease-in-out"}`}
          style={{
            gap: GAP,
            transform: `translateX(calc(-1 * ${index} * (${CARD_W} + ${GAP}) + ${dragPx}px))`,
          }}
        >
          {GAMES.map((game) => (
            <div key={game.name} className="shrink-0 h-full" style={{ width: CARD_W }}>
              <GameCard
                name={game.name}
                imgSrc={isMobile ? game.mobile : game.desktop}
                handleInfo={handleInfo}
                handlePlay={handlePlay}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * NavigationButton
 *
 * @param {React.ComponentType} icon  A lucide-react icon component (passed by
 *                                    reference, e.g. ArrowBigLeftDash, then
 *                                    rendered as <Icon /> inside).
 * @param {number} size               Icon size in px.
 * @param {() => void} onClick        Click handler (pass the handler itself,
 *                                    not a call: onClick={next}, not next()).
 * @param {boolean} disabled          Greys out and disables the button at a
 *                                    track end.
 */
function NavigationButton({ icon: Icon, size, onClick, disabled }) {
  return (
    <button
      className="flex items-center justify-center cursor-pointer hover:opacity-90 focus-visible:opacity-90 disabled:opacity-30 disabled:cursor-default"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon color="white" size={size} strokeWidth={2}/>
    </button>
  );
}