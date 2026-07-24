import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePartyContext } from "@/hooks/usePartyContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSlangContext } from "@/hooks/useSlangContext";

import SettingsPanel from "@/components/SettingsPanel";
import MembersPanel from "@/components/MembersPanel";
import SlangGame from "@/components/SlangGame";

/**
 * SlangPage
 * 
 * Main page for the Slang! game.
 * Wraps the game with header, settings, and layout.
 * 
 * This page is shown after the user clicks "Play" on the Slang card.
 * It's wrapped with SlangProvider in main.jsx routing.
 */

export default function SlangPage() {
  const navigate = useNavigate();
  const { partyCode } = usePartyContext();
  const { handleLeave } = useSlangContext();

  useEffect(() => {
    if (!partyCode) {
      navigate("/");
    }
  }, [partyCode, navigate]);

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-black">
      {/* Settings Panel */}
      <SettingsPanel />

      {/* Members Panel */}
      <MembersPanel />

      {/* Header */}
      <header className="w-full flex justify-center items-center z-[3] py-[24px]">
        <h1 className="text-3xl lg:text-4xl font-display uppercase text-white">
          Slang!
        </h1>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 overflow-auto">
        <SlangGame />
      </main>
    </div>
  );
}