import { useState, useRef, useEffect } from "react";
import { CircleX } from "lucide-react";
import kickPlayerIcon from "../assets/icons/KickPlayer.svg";

// TODO: Replace this stub with the real backend call when the endpoint exists.
function onKick(username) {
  alert(`Kicked Player: ${username}`);
}

function MemberItem({ username }) {
  const [isKickState, setIsKickState] = useState(false);
  const memberRef = useRef(null);
  const kickButtonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (memberRef.current && !memberRef.current.contains(event.target)) {
        setIsKickState(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      ref={memberRef} 
      className="relative overflow-hidden font-bold text-4xl tracking-tight"
      onBlur={(e) => {
        // when the user tabs out of the member item, close the kick state
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsKickState(false);
        }
      }}  
    >
      <button
        type="button"
        className="flex w-full justify-between items-center px-5 py-5 bg-black text-white cursor-pointer focus-visible:bg-white focus-visible:text-black"
        onClick={() => {
          // when the user clicks the member item, open the kick state
          // if using the keyboard, focus the kick button right away
          setIsKickState(true);
          kickButtonRef.current?.focus({preventScroll: true});
        }}
      >
        <span className="truncate min-w-0 mr-4">{username}</span>
        <div className="h-[0.7em] shrink-0">
          <img src={kickPlayerIcon} alt="Kick player" className="h-full mix-blend-difference" />
        </div>
      </button>

      <div
        className={`absolute inset-0 flex items-center px-5 bg-[#ff2a2a] text-white transition-transform duration-[750ms] ease-[cubic-bezier(0.25,0.6,0.25,1)] ${isKickState ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          type="button"
          className="flex-1 flex justify-center items-center cursor-pointer"
          onClick={() => onKick(username)}
          tabIndex={isKickState ? 0 : -1}
          ref={kickButtonRef}
        >
          Kick?
        </button>
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