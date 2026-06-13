import { CircleX } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useState } from "react";

export default function Panel({ header, children, icon, position }) {
  const isMobile = useMediaQuery("(max-width: 1300px)"); // Check if the screen is smaller than a desktop (tablet or below)
  const [isOpen, setIsOpen] = useState(false); // State to track if the panel is open

  // Determine the position styles based on the position prop
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

  // Panel styles based on the isOpen and isMobile states
  const panelOpenMobileStyles = `absolute ${panelPositionStyles} w-screen h-screen bg-black !border-0`;
  const panelOpenDesktopStyles = `absolute ${panelPositionStyles} w-1/4 max-w-[450px] h-screen bg-black border-white`;
  const panelClosedStyles = `absolute ${panelPositionStyles} !border-0`;

  return (
    <>
      {/* backdrop blur | only render if the panel is open and the screen is desktop */}
      {isOpen && !isMobile && (<div className="absolute top-0 left-0 w-screen h-screen backdrop-blur-sm z-[9998]" />)}
      {/* Panel */}
      <aside
        className={`${isOpen ? (isMobile ? panelOpenMobileStyles : panelOpenDesktopStyles) : panelClosedStyles} z-[9999]`}
      >
        {/* Apply the appropriate styles based on the state */}
        {isOpen ? (
          <>
            {/* This is the Panel Header */}
            <div className="relative w-full h-16 flex items-center border-b-2 border-white/24">
              {isMobile ? (
                <div className="w-full flex justify-between items-center gap-4">
                  <div className="min-w-0 truncate">{header}</div>
                  <CircleX
                    className="mr-4 cursor-pointer shrink-0"
                    size={40}
                    onClick={() => setIsOpen(false)}
                  />
                </div>
              ) : (
                <>
                  <div className="min-w-0 truncate">{header}</div>
                  <CircleX
                    className={`absolute mr-4 cursor-pointer ${desktopCloseIconPositionStyle} shrink-0`}
                    size={40}
                    onClick={() => setIsOpen(false)}
                  />
                </>
              )}
            </div>

            {/* This is the Panel Content */}
            {children}
          </>
        ) : (
          // If the panel is closed, just show the icon
          <div
            className="p-4 cursor-pointer"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            {icon}
          </div>
        )}
      </aside>
    </>
  );
}
