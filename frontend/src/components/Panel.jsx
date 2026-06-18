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
 *   @param {React.ReactNode} header   Content shown in the header bar when open.
 *                                     Truncates with an ellipsis if too wide.
 *   @param {React.ReactNode} children Body content shown below the header when open.
 *   @param {React.ReactNode} icon     The clickable element shown when the panel
 *                                     is closed (e.g. an icon button).
 *   @param {"tl"|"tr"|"bl"|"br"} position
 *                                     Which corner to anchor to. Controls both the
 *                                     panel's screen position and which border edge
 *                                     it draws. Defaults to "tl" for unknown values.
 *
 * Note: open/closed state is internal. The panel always mounts closed.
 */
export default function Panel({ header, children, icon, position, ariaLabel }) {
  const isMobile = useMediaQuery("(max-width: 1300px)"); // tablet or below
  const [isOpen, setIsOpen] = useState(false);
  const panelCloseButtonRef = useRef(null);
  const panelOpenButtonRef = useRef(null);

  useEffect(() => {
    if (panelCloseButtonRef.current || panelOpenButtonRef.current) {
      if (isOpen) {
        panelCloseButtonRef.current.focus();
      } else {
        panelOpenButtonRef.current.focus();
      }
    }
  }, [isOpen])

  // Map the `position` prop to two sets of classes:
  //   panelPositionStyles            -> where the panel anchors + which border edge it draws
  //   desktopCloseIconPositionStyle  -> where the close icon sits relative to the panel
  //                                     (only used on desktop, where it floats outside the edge)
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
    default: // unknown / missing position falls back to top-left
      panelPositionStyles = "top-0 left-0 border-r-2";
      desktopCloseIconPositionStyle = "right-[-24px] translate-x-full";
  }

  // Three visual states. The `!border-0` overrides force the border off in the
  // states that shouldn't show one (mobile-open and closed), beating the
  // border-* classes baked into panelPositionStyles.
  const panelOpenMobileStyles = `absolute ${panelPositionStyles} w-screen h-screen bg-black !border-0`;
  const panelOpenDesktopStyles = `absolute ${panelPositionStyles} w-1/4 max-w-[450px] h-screen bg-black border-white`;
  const panelClosedStyles = `absolute ${panelPositionStyles} !border-0`;

  return (
    <>
      {/* Backdrop blur. Desktop-only, and only while open. Sits one z-layer
          below the panel so the panel stays sharp on top. */}
      {isOpen && !isMobile && (
        <div className="absolute top-0 left-0 w-screen h-screen backdrop-blur-sm z-[9998]" />
      )}

      <aside
        className={`${isOpen ? (isMobile ? panelOpenMobileStyles : panelOpenDesktopStyles) : panelClosedStyles} z-[9999]`}
      >
        {isOpen ? (
          <>
            {/* Header bar: header content on the left, close icon on the right. */}
            <div className="relative w-full h-16 flex items-center border-b-2 border-white/24">
              {isMobile ? (
                // Mobile: close icon lives inside the header, pushed right via justify-between.
                <div className="w-full flex justify-between items-center gap-4">
                  {/* min-w-0 lets the header shrink so truncate can clip it instead
                      of overflowing past the shrink-0 close icon */}
                  <div className="min-w-0 truncate">{header}</div>
                  <button className={`mr-4 cursor-pointer shrink-0`} onClick={() => setIsOpen(false)} ref={panelCloseButtonRef} aria-label={`close ${ariaLabel}`}>
                    <CircleX size={40} />
                  </button>
                </div>
              ) : (
                // Desktop: close icon is absolutely positioned just outside the
                // panel edge via desktopCloseIconPositionStyle.
                <>
                  <div className="min-w-0 truncate">{header}</div>
                  <button className={`absolute mr-4 cursor-pointer ${desktopCloseIconPositionStyle} shrink-0`} onClick={() => setIsOpen(false)} ref={panelCloseButtonRef} aria-label={`close ${ariaLabel}`}>
                    <CircleX size={40} />
                  </button>
                </>
              )}
            </div>

            {/* Body */}
            {children}
          </>
        ) : (
          // Closed: render only the icon, which opens the panel on click.
          <button className="p-4 cursor-pointer" onClick={() => setIsOpen(true)} ref={panelOpenButtonRef} aria-label={`open ${ariaLabel}`}>
            {icon}
          </button>
        )}
      </aside>
    </>
  );
}