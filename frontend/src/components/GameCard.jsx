import { useState} from 'react'
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
  const [isLoading, setIsLoading] = useState(false);
  const { isMobile } = usePartyContext();

  function onInfoClick(event) {
    event.stopPropagation();
    handleInfo?.(name);
  }

  const onHandlePlay = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try{
      await handlePlay(name)
    }
    catch (error) {
      console.error("Error launching game:", error);
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`relative w-full h-full rounded-lg overflow-hidden bg-clip-padding border-2 p-4 xl:p-6 ${
        isLoading 
          ? "border-white/20 cursor-wait" 
          : "border-transparent hover:border-white cursor-pointer"
      }`}
      style={{
        backgroundImage: `url(${imgSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
      onClick={onHandlePlay}
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
