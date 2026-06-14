/**
 * PartyCode
 *
 * Displays the current party/lobby code.
 *
 * It has two visual modes:
 *   - Full: centered card with title, white background, black border, and large code text.
 *   - Compact: small corner-anchored code display for use inside a relative container.
 *
 * Props:
 *   @param {string} partyCode
 *     The party/lobby code to display.
 *   @param {boolean} isCompact
 *     Whether to render the compact corner version. Defaults to false.
 *   @param {"tl"|"tr"|"bl"|"br"} position
 *     Which corner to anchor to when compact:
 *       - "tl" = top-left
 *       - "tr" = top-right
 *       - "bl" = bottom-left
 *       - "br" = bottom-right
 *
 * Note: The compact version uses absolute positioning, so its parent should be relative.
 */
function PartyCode( { partyCode, isCompact = false, position = "bl" } ) {

    if (!isCompact) {
        return (
            <div className="mx-auto w-[80vw] max-w-[400px]">
                <h2 className="mb-4 text-center text-4xl font-bold text-white">
                    Party Code
                </h2>

                <div className="rounded-md bg-white p-5">
                    <div className="rounded-md border-2 border-black px-5 py-4 text-center">
                        <span className="text-6xl font-bold text-black">
                            {partyCode}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

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
            partyCodeLabelStyles = "top-full mt-1"
            break;

        case "tr":
            partyCodePositionStyles = "top-0 right-0 border-b-2 border-l-2 rounded-bl-2xl";
            partyCodeLabelStyles = "top-full mt-1"
            break;

        default: // default to bl
            partyCodePositionStyles = "bottom-0 left-0 border-t-2 border-r-2 rounded-tr-2xl";
            partyCodeLabelStyles = "bottom-full mb-1"
            break;
    }

    return (
        <div className={`absolute ${partyCodePositionStyles} flex min-h-[60px] min-w-[180px] px-8 py-4 items-center justify-center border-white bg-black`}>
            <span className={`absolute ${partyCodeLabelStyles} left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[clamp(0.6rem,3vmin,1rem)] font-bold leading-tight text-white`}>
                Party Code
            </span>
            <span className="text-5xl font-bold text-white whitespace-nowrap px-2">
                {partyCode}
            </span>
        </div>
    );
}

export default PartyCode;