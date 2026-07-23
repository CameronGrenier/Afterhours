import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartyContext } from "@/hooks/usePartyContext.js";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Background topology images
import topoLandscape from "@/assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "@/assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "@/assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "@/assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "@/assets/Images/topology_bg_images/topology-ultrawide.webp";

import SettingsPanel from "@/components/SettingsPanel.jsx";
import LobbyScreen from "./LobbyScreen.jsx";

export default function LobbyPage() {
  const navigate = useNavigate();
  const { partyCode } = usePartyContext();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [mainDimensions, setMainDimensions] = useState({ width: 0, height: 0 });
  const mainRef = useRef(null);

  // Safety guard: Redirect to landing page if accessed without joining a room
  useEffect(() => {
    if (!partyCode) {
      navigate("/");
    }
  }, [partyCode, navigate]);

  // Measure main container for spiral placement math in LobbyScreen
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setMainDimensions(el.getBoundingClientRect());
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  if (!partyCode) return null;

  return (
    <main
      className="relative w-screen h-dvh px-8 flex flex-col items-center justify-center bg-black overflow-hidden"
      ref={mainRef}
    >
      {/* Background Imagery */}
      <picture className="fixed inset-0 z-[1]">
        <source
          media="(orientation: portrait)"
          srcSet={`${topoPortrait} 1x, ${topoPortrait2x} 2x`}
        />
        <source media="(min-aspect-ratio: 2/1)" srcSet={topoUltrawide} />
        <img
          src={topoLandscape}
          srcSet={`${topoLandscape} 1x, ${topoLandscape2x} 2x`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10"
        />
      </picture>

      {/* Gradients */}
      <div className="fixed inset-0 bg-[linear-gradient(to_top_left,#000,70%,transparent)] z-[2]" />
      {isMobile && (
        <>
          <div className="fixed inset-0 bg-[linear-gradient(to_top,transparent_80%,black)] z-[2]" />
          <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_90%,black)] z-[2]" />
        </>
      )}

      <SettingsPanel />

      <LobbyScreen dimensions={mainDimensions} isMobile={isMobile} />
    </main>
  );
}