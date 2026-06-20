import {playSound} from "../audio/playSound.jsx";

/**
 * Button component used across the app for interactive actions.
 *
 * Props:
 * - variant: style variation for the button (dark, light, danger).
 * - ariaLabel: accessibility label for the button.
 * - onClick: click handler function.
 * - children: button label or nested content.
 */
export default function Button({ variant, ariaLabel, onClick, children }) {
  
let base, hover, focus;
  switch (variant) {
    case "dark":
      base  = "bg-black text-white border-white";
      hover = "hover:bg-white hover:text-black hover:border-black";
      focus = "focus-visible:bg-white focus-visible:text-black focus-visible:border-black";
      break;
    case "light":
      base  = "bg-white text-black border-black";
      hover = "ho   ver:bg-black hover:text-white hover:border-black";
      focus = "focus-visible:bg-black focus-visible:text-white focus-visible:border-black";
      break;
    case "danger":
      base  = "bg-danger text-white border-danger";
      hover = "hover:bg-white hover:text-danger hover:border-danger";
      focus = "focus-visible:bg-white focus-visible:text-danger focus-visible:border-danger";
      break;
    default:
      base  = "bg-black text-white border-white";
      hover = "hover:bg-white hover:text-black hover:border-black";
      focus = "focus-visible:bg-white focus-visible:text-black focus-visible:border-black";
  }

  const buttonStyle = `${base} ${hover} ${focus}`;

  return (
    <button
      className={`w-full rounded-md px-16 py-4 text-2xl font-bold border-2 cursor-pointer transition-colors duration-200 ${buttonStyle}`}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={() => playSound("buttonDown")}
      onPointerUp={() => playSound("buttonUp")}
    >
    {children}
    </button>
  );
}