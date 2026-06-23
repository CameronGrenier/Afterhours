import { useState, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { ArrowBigRightDash, ArrowBigLeftDash } from "lucide-react";

export default function Instructions({ ref, children }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <dialog
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full open:grid grid-cols-[64px_1fr_64px] gap-[100px] place-items-center backdrop:backdrop-blur-sm bg-transparent p-4"
      ref={ref}
    >
      <NavigationButton icon={ArrowBigLeftDash} />

      {/* parallelogram shape */}
      <div className="relative w-full h-[70%] h-64 bg-black border-2 border-white -skew-x-12 rounded-2xl">
        {/* Main content */}
        <div className="absolute top-0 left-1/2 -translate-x-[60%] -translate-y-1/2 flex items-center justify-center px-8 py-4 bg-black border-2 border-white rounded-xl">
          <h2 className="text-8xl font-bold text-white tracking-tight">Instructions</h2>
        </div>
        <div className="skew-x-12 flex items-center justify-center p-2">
          {children}
        </div>
        <form method="dialog">
          <button className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1/6 flex items-center justify-center bg-white text-black text-4xl font-bold rounded-xl py-8 border-2 border-black hover:bg-black hover:border-white hover:text-white focus-visible:bg-black focus-visible:border-white focus-visible:text-white cursor-pointer">
            OK
          </button>
        </form>   
      </div>

      <NavigationButton icon={ArrowBigRightDash} />
    </dialog>
  );
}

function NavigationButton({ icon: Icon, onClick }) {
  return (
    <button
      className="w-[64px] flex items-center justify-center rounded-2xl border-2 border-white bg-black aspect-square cursor-pointer hover:bg-white focus-visible:bg-white"
      onClick={onClick}
    >
      <Icon
        color="white"
        size={40}
        strokeWidth={2}
        className="mix-blend-difference"
      />
    </button>
  );
}
