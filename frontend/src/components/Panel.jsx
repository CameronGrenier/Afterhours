import { CircleX } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useState, useRef, useEffect } from "react";

/**
 * Panel
 *
 * A collapsible side panel anchored to a corner of the screen. It renders as a
 * small clickable icon when closed, and expands into a full panel when clicked.
 *
 * Behavior differs by screen size (breakpoint: 1300px):
 *   - Desktop: opens to a fixed-width panel (1/4 screen, max 450px) with a
 *     backdrop blur behind it. The close icon sits just outside the panel edge.
 *   - Mobile/tablet: opens fullscreen with no backdrop. The close icon sits
 *     inside the header, right-aligned.
 *
 * Props:
 *   @param {string} className         Additional CSS classes to apply to the panel.
 *   @param {React.ReactNode} header   Content shown in the header bar when open.
 *                                     Truncates with an ellipsis if too wide.
 *   @param {React.ReactNode} children Body content shown below the header when open.
 *   @param {React.ReactNode} icon     The clickable element shown when the panel
 *                                     is closed (e.g. an icon button).
 *   @param {"tl"|"tr"|"bl"|"br"} position
 *                                     Which corner to anchor to. Controls both the
 *                                     panel's screen position and which border edge
 *                                     it draws. Defaults to "tl" for unknown values.
 *   @param {string} ariaLabel         Accessible label used for open/close buttons.
 *
 * Note: open/closed state is internal. The panel always mounts closed.
 */
export default function Panel({ className, header, children, icon, position, ariaLabel }) {
  const isMobile = useMediaQuery("(max-width: 1300px)");
  const [isOpen, setIsOpen] = useState(false);
  const [panelHasBeenOpened, setPanelHasBeenOpened] = useState(false); // flag set on first open for accessibility

  const panelCloseButtonRef = useRef(null);
  const panelOpenButtonRef = useRef(null);
  const asideRef = useRef(null);
  const backdropRef = useRef(null);

  // -------------------------------------------------------------------------
  // Accessibility: inert all siblings when the panel is open.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const aside = asideRef.current;
    const parent = aside?.parentElement;
    if (!parent) return;

    const panelOwned = [aside, backdropRef.current];
    const inerted = [];

    for (const child of parent.children) {
      if (!panelOwned.includes(child) && !child.hasAttribute("inert")) {
        child.setAttribute("inert", "");
        inerted.push(child);
      }
    }

    return () => {
      for (const el of inerted) {
        el.removeAttribute("inert");
      }
    };
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Focus management: move focus to the correct button when state changes.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (panelCloseButtonRef.current || panelOpenButtonRef.current) {
      if (isOpen) {
        panelCloseButtonRef.current.focus();
      } else if (panelHasBeenOpened) {
        panelOpenButtonRef.current.focus();
      }
    }
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Position mapping: choose panel placement and desktop close icon offsets.
  // -------------------------------------------------------------------------
  let panelPositionStyles;
  let desktopCloseIconPositionStyle;

  switch (position) {
    case "tl":
      panelPositionStyles = "top-0 left-0 border-r-2";
      desktopCloseIconPositionStyle = "right-[-24px] translate-x-full";
      break;

    case "tr":
      panelPositionStyles = "top-0 right-0 border-l-2";
      desktopCloseIconPositionStyle = "left-[-24px] -translate-x-full";
      break;

    case "bl":
      panelPositionStyles = "bottom-0 left-0 border-r-2";
      desktopCloseIconPositionStyle = "right-[-24px] translate-x-full";
      break;

    case "br":
      panelPositionStyles = "bottom-0 right-0 border-l-2";
      desktopCloseIconPositionStyle = "left-[-24px] -translate-x-full";
      break;

    default:
      panelPositionStyles = "top-0 left-0 border-r-2";
      desktopCloseIconPositionStyle = "right-[-24px] translate-x-full";
  }

  // -------------------------------------------------------------------------
  // Style variants for the three panel states.
  // -------------------------------------------------------------------------
  const panelOpenMobileStyles = `absolute ${panelPositionStyles} w-screen bg-black !border-0`;
  const panelOpenDesktopStyles = `absolute ${panelPositionStyles} w-1/4 max-w-[450px] bg-black border-white`;
  const panelClosedStyles = `absolute ${panelPositionStyles} !border-0`;

  return (
    <>
      {isOpen && !isMobile && (
        <div
          ref={backdropRef}
          className="absolute top-0 left-0 w-screen h-screen backdrop-blur-sm z-[9998]"
        />
      )}

      <aside
        ref={asideRef}
        className={`${isOpen ? (isMobile ? panelOpenMobileStyles : panelOpenDesktopStyles) : panelClosedStyles} ${className} flex flex-col ${isOpen ? "z-[9999]" : "z-[10]"} h-screen`}
      >
        {isOpen ? (
          <>
            <div className="relative w-full h-16 flex items-center border-b-2 border-white/24">
              {isMobile ? (
                <div className="w-full flex justify-between items-center gap-4">
                  <div className="w-full min-w-0 truncate">{header}</div>

                  <button
                    className="mr-4 cursor-pointer shrink-0"
                    onClick={() => setIsOpen(false)}
                    ref={panelCloseButtonRef}
                    aria-label={`close ${ariaLabel}`}
                  >
                    <CircleX size={40} color="#ffffff"/>
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-full min-w-0 truncate">{header}</div>

                  <button
                    className={`absolute mr-4 cursor-pointer ${desktopCloseIconPositionStyle} shrink-0`}
                    onClick={() => setIsOpen(false)}
                    ref={panelCloseButtonRef}
                    aria-label={`close ${ariaLabel}`}
                  >
                    <CircleX size={40} color="#ffffff"/>
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 h-min-0 overflow-y-auto">{children}</div>
          </>
        ) : (
          <button
            className="p-4 m-1 cursor-pointer"
            onClick={() => {
              setIsOpen(true);
              setPanelHasBeenOpened(true);
            }}
            ref={panelOpenButtonRef}
            aria-label={`open ${ariaLabel}`}
          >
            {icon}
          </button>
        )}
      </aside>
    </>
  );
}
