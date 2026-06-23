import { Info } from "lucide-react";

/**
 * Responsive game selection card.
 *
 * @param {string} name - Game title displayed on the card
 * @param {string} imgSrc - Background artwork source
 * @param {(name: string) => void} handleInfo - Called when the info button is clicked
 * @param {() => void} handlePlay - Called when the card is clicked
 * @returns {React.ReactNode} Game card
 */

function Gamecard({ name, imgSrc, handleInfo, handlePlay }) {
  function onInfoClick(event) {
    event.stopPropagation();
    handleInfo?.(name);
  }

  return (
    <div className="group relative w-full">
      <button
        type="button"
        onClick={handlePlay}
        aria-label={`Play ${name}`}
        className="relative aspect-[0.7/1] w-full cursor-pointer overflow-hidden rounded-[1.4rem] border-2 border-transparent bg-cover bg-no-repeat text-left outline-none transition-colors duration-200 [background-position:center_58%] sm:aspect-[1.5/1] group-hover:border-white group-focus-within:border-white focus-visible:border-white"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.16) 0%, rgba(0, 0, 0, 0.04) 38%, rgba(0, 0, 0, 0.42) 100%), url(${imgSrc})`,
        }}
      >
        <div className="relative z-10 flex h-full items-start p-4 sm:p-5 md:p-6">
          <h2 className="max-w-[72%] font-sans text-[clamp(2.75rem,6vw,4rem)] leading-none font-bold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
            {name}
          </h2>
        </div>
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-2 sm:p-3 md:p-4">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={onInfoClick}
            aria-label={`More info about ${name}`}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-105 focus-visible:scale-105 focus-visible:outline-none"
          >
            <Info className="mt-3 h-7 w-7 stroke-[2.35]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Gamecard;
