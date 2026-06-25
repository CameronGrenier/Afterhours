import { useState, useRef, useEffect } from "react";
import { CircleX } from "lucide-react";
import kickPlayerIcon from "../assets/icons/KickPlayer.svg";

/**
 * MemberItem Component
 *
 * Displays a lobby member with an interactive kick action. The component features
 * a sliding reveal animation that exposes the "Kick?" confirmation button.
 *
 * Behavior:
 *   - Click or focus: reveals the kick confirmation action
 *   - Click "Kick?": calls onKick handler
 *   - Click cancel or click outside: hides the action
 *   - Tab out: closes the action
 *
 * Accessibility:
 *   - Proper focus management for keyboard navigation
 *   - Appropriate ARIA labels on buttons
 *   - Works with keyboard-only input
 *
 * @param {string} username - The display name of the party member
 * @param onKick - The action taken when kicking a player
 * @returns {React.ReactNode} Member item element with kick action
 */
function MemberItem({ username , onKick, kickEnabled }) {
  // =========================================================================
  // State Management
  // =========================================================================
  const [isKickState, setIsKickState] = useState(false); // Whether the kick action is revealed
  const memberRef = useRef(null);
  const kickButtonRef = useRef(null);

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Close the kick action when user clicks outside the component.
   * Listens for mousedown events on the document.
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (memberRef.current && !memberRef.current.contains(event.target)) {
        setIsKickState(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div
      ref={memberRef}
      className="relative overflow-hidden font-bold text-4xl tracking-tight"
      onBlur={(e) => {
        // Close kick action when user tabs away from the component
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsKickState(false);
        }
      }}
    >
      {/* Member Display Button */}
      <button
        type="button"
        className="flex w-full justify-between items-center px-5 py-5 bg-black text-white cursor-pointer focus-visible:bg-white focus-visible:text-black"
        onClick={() => {
          // Open the kick action and focus the kick button for keyboard users
          setIsKickState(true);
          kickButtonRef.current?.focus({ preventScroll: true });
        }}
      >
        {/* Username text (truncated if too long) */}
        <span className="truncate min-w-0 mr-4">{username}</span>

        {/* Kick icon */}
        <div className="h-[0.7em] shrink-0">
          <img
            src={kickPlayerIcon}
            alt="Kick player"
            className="h-full mix-blend-difference"
          />
        </div>
      </button>

      {/* Kick Action Overlay (slides in from the right) */}
      <div
        className={`absolute inset-0 flex items-center px-5 bg-[#ff2a2a] text-white transition-transform duration-[750ms] ease-[cubic-bezier(0.25,0.6,0.25,1)] ${
          (kickEnabled && isKickState) ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Kick Confirmation Button */}
        <button
          type="button"
          className="flex-1 flex justify-center items-center cursor-pointer"
          onClick={() => {
              onKick(username);
              setIsKickState(false);
          }}
          tabIndex={isKickState ? 0 : -1}
          ref={kickButtonRef}
        >
          Kick?
        </button>

        {/* Cancel Kick Button */}
        <button
          type="button"
          className="cursor-pointer"
          onClick={() => setIsKickState(false)}
          aria-label={`Cancel kick for ${username}`}
          tabIndex={isKickState ? 0 : -1}
        >
          <CircleX className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
}

export default MemberItem;