/**
 * PartyCode Component
 *
 * Displays the party/lobby code in two distinct visual modes.
 *
 * Modes:
 *   - Full: Centered card with title, white background, and black border.
 *     Used on full pages as a primary display element.
 *   - Compact: Corner-anchored code display for integration within
 *     other components. Uses absolute positioning.
 *
 * @param {string} partyCode - The party/lobby code to display
 * @param {boolean} [isCompact=false] - Whether to render compact version
 * @param {"tl"|"tr"|"bl"|"br"} [position="bl"] - Corner anchor for compact mode:
 *                                                   - "tl" = top-left
 *                                                   - "tr" = top-right
 *                                                   - "bl" = bottom-left
 *                                                   - "br" = bottom-right
 *
 * Note: The compact version uses absolute positioning. Parent element
 *       must have `position: relative` for correct placement.
 *
 * @returns {React.ReactNode} Party code display element
 */
function PartyCode({ partyCode, isCompact = false, position = "bl" }) {
  // =========================================================================
  // Full Mode: Centered Card Display
  // =========================================================================
  if (!isCompact) {
    return (
      <div className="mx-auto w-full">
        {/* Section Title */}
        <h2 className="mb-4 text-center text-4xl font-bold text-white">
          Party Code
        </h2>

        {/* Code Card with Border */}
        <div className="rounded-md bg-white p-4">
          <div className="rounded-md border-2 border-black px-5 py-4 text-center">
            {/* Code Display */}
            <span className="text-6xl font-bold text-black">
              {partyCode}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Compact Mode: Corner-Anchored Display
  // =========================================================================

  // Position-specific styles: corner placement and border direction
  let partyCodePositionStyles;
  let partyCodeLabelStyles;

  switch (position) {
    case "bl":
      partyCodePositionStyles = "bottom-0 left-0 border-t-2 border-r-2 rounded-tr-2xl";
      partyCodeLabelStyles = "bottom-full mb-1";
      break;

    case "br":
      partyCodePositionStyles = "bottom-0 right-0 border-t-2 border-l-2 rounded-tl-2xl";
      partyCodeLabelStyles = "bottom-full mb-1";
      break;

    case "tl":
      partyCodePositionStyles = "top-0 left-0 border-b-2 border-r-2 rounded-br-2xl";
      partyCodeLabelStyles = "top-full mt-1";
      break;

    case "tr":
      partyCodePositionStyles = "top-0 right-0 border-b-2 border-l-2 rounded-bl-2xl";
      partyCodeLabelStyles = "top-full mt-1";
      break;

    default:
      // Default to bottom-left
      partyCodePositionStyles = "bottom-0 left-0 border-t-2 border-r-2 rounded-tr-2xl";
      partyCodeLabelStyles = "bottom-full mb-1";
  }

  return (
    <div
      className={`fixed ${partyCodePositionStyles} flex min-h-[60px] min-w-[180px] px-8 py-4 items-center justify-center border-white bg-black`}
    >
      {/* Label positioned above or below the code */}
      <span
        className={`absolute ${partyCodeLabelStyles} left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[clamp(0.6rem,3vmin,1rem)] font-bold leading-tight text-white`}
      >
        Party Code
      </span>

      {/* Party code display */}
      <span className="text-5xl font-bold text-white whitespace-nowrap px-2">
        {partyCode}
      </span>
    </div>
  );
}

export default PartyCode;