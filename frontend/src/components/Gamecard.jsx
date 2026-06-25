import { Info } from "lucide-react";
import { usePartyContext } from '@/hooks/usePartyContext';

/**
 * Responsive game selection card.
 *
 * @param {string} name - Game title displayed on the card
 * @param {string} imgSrc - Background artwork source
 * @param {string} color - CSS color for the game title
 * @param {(name: string) => void} handleInfo - Called when the info button is clicked
 * @param {() => void} handlePlay - Called when the card is clicked
 * @returns {React.ReactNode} Game card
 */
export default function GameCard({
  name,
  imgSrc,
  color = "white",
  handleInfo,
  handlePlay,
}) {
  const { isMobile } = usePartyContext();

  function onInfoClick(event) {
    event.stopPropagation();
    handleInfo?.(name);
  }

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden bg-clip-padding border-2 border-transparent hover:border-white cursor-pointer p-4 xl:p-6"
      style={{
        backgroundImage: `url(${imgSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
      onClick={handlePlay}
    >
      <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-none" style={{ color }}>
        {name}
      </h2>
      <button
        className={`absolute top-4 right-4 xl:top-6 xl:right-6 cursor-pointer hover:scale-110`}
        onClick={onInfoClick}
      >
        <Info color="white" size={isMobile? 32 : 40} />
      </button>
    </div>
  );
}
