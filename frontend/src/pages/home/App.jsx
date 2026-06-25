import { useEffect, useState, useRef } from "react";
import { Bolt } from "lucide-react";

// Background topology images with responsive variants
import topoLandscape from "@/assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "@/assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "@/assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "@/assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "@/assets/Images/topology_bg_images/topology-ultrawide.webp";

// Api related methods
import {request, socket} from "@/api/client";
import { createRoom, joinRoom, kickPlayer, leaveRoom } from "@/api/room";

// Components and hooks
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { setMusicVolume, setSfxVolume } from "@/lib/audio/audioSettings.js";
import {
  startLobbyMusic,
  stopLobbyMusic,
} from "@/lib/audio/lobbyMusicPlayer.js";
import { useNavigate } from "react-router-dom";
import { usePartyContext } from "@/hooks/usePartyContext.js";

import SettingsPanel from "@/components/SettingsPanel.jsx";

import HomeScreen from "./HomeScreen.jsx";
import JoinScreen from "./JoinScreen.jsx";
import LobbyScreen from "./LobbyScreen.jsx";

/**
 * Main App Component
 *
 * Top-level screen coordinator for the Afterhours landing flow. Party state
 * (SID, screen, party code, username, players, volumes) now lives in
 * PartyProvider and is read via usePartyContext(). This component owns only
 * local UI concerns — media queries, the main-element size measurement, and
 * the handlers that drive transitions between the home, join, and lobby
 * screens. It also renders the responsive background imagery and settings
 * panel.
 */
export default function App() {
  // =========================================================================
  // Media Queries
  // =========================================================================
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMobileLandscape = useMediaQuery(
    "(orientation: landscape) and (max-height: 500px)",
  );

  // =========================================================================
  // Party Context
  // =========================================================================
  // Only the values this component actually uses are pulled in. The child
  // screens read what they need directly from usePartyContext() rather than
  // receiving it as props.
  const {
    sid,
    setSid,
    setIsHost,
    screen,
    setScreen,
    partyCode,
    setPartyCode,
    username,
    setUsername,
    setPlayers,
    sfxVolume,
    setSfxVolumeValue,
    musicVolume,
    setMusicVolumeValue,
    warning,
    error,
  } = usePartyContext();

  // =========================================================================
  // Local State + Refs
  // =========================================================================
  const [mainDimensions, setMainDimensions] = useState(null);
  const mainRef = useRef(null);

  // =========================================================================
  // Effects
  // =========================================================================

  // Re-measure the main element whenever it resizes (window resize, orientation
  // flip, mobile URL-bar show/hide). ResizeObserver also fires once right after
  // observe(), so this covers the initial measurement too.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setMainDimensions(el.getBoundingClientRect());
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Seed SID on mount if already connected, and refresh it on (re)connect.
  useEffect(() => {
      request("/session", { method: "Get" }).catch((err) => {
          console.error("Failed to establish session", err);
      });
  }, []);
  useEffect(() => {
    if (socket.connected) setSid(socket.id);
  }, []);
  useSocketEvent("connect", () => {
    setSid(socket.id);
  });

  // =========================================================================
  // Screen Transition Handlers
  // =========================================================================

  /**
   * Joins an existing party. PascalCases the username, sends the join request,
   * stores the room code the server returns, and moves to the lobby screen.
   */
  async function handleJoinLobby() {
    const pascal = toPascalCase(username);
    setUsername(pascal);

    const response = await joinRoom(sid, partyCode, pascal);
    const status = response["status"];
    if (status === "codeError") {
      error(`Error: room does not exist`);
      return;
    } else if (status === "nameConflict") {
      warning(`You snooze you loose. Somebody already took ${pascal}`);
      return;
    }
    setPartyCode(response["Room Code"]);
    // get server time here

    setScreen("lobby");
  }

  /**
   * Creates a new party. PascalCases the username, asks the server to create a
   * room, and on success seeds the local party code and player list before
   * moving to the lobby screen.
   */
  async function handleHostLobby() {
    const pascal = toPascalCase(username);
    setUsername(pascal);

    const response = await createRoom(sid, pascal);
    const status = response["status"];
    if (status !== "success") {
      error(`${status}: ${response["message"]}`);
      return;
    }
    const code = response["Room Code"];
    if (!code) {
      alert("Party code could not be generated. Try again later.");
      error("No party code returned from server");
    } else {
      setIsHost(true);
      setPartyCode(response["Room Code"]);
      setPlayers([pascal]);
      setScreen("lobby");
    }
  }

  /**
   * Cancels joining and resets back to the home screen.
   */
  function handleCancel() {
    setIsHost(false);
    setScreen("home");
    setPartyCode("");
    setUsername("");
  }

  /**
   * Leaves the current room and returns to the join screen. Notifies the server
   * so the player is removed and other clients receive an updated player list.
   */
  function handleLeaveRoom() {
    setIsHost(false);
    leaveRoom(sid, partyCode, username);
    setScreen("join");
  }

  // =========================================================================
  // Utilities
  // =========================================================================

  /**
   * Converts a string to PascalCase.
   *   1. Replaces punctuation / non-alphanumerics with spaces
   *   2. Capitalizes the first letter of each word
   *   3. Strips all whitespace
   *
   * Example: "hello-world" → "HelloWorld"
   *
   * @param {string} str - The string to convert
   * @returns {string} The PascalCase formatted string
   */
  function toPascalCase(str) {
    return str
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (match) => match.toUpperCase())
      .replace(/\s+/g, "");
  }

  return (
    <main
      className="relative w-screen h-dvh px-8 flex flex-col items-center justify-center bg-black overflow-hidden"
      ref={mainRef}
    >
      {/* =====================================================================
          Background Imagery
          ===================================================================== */}
      <picture className="fixed inset-0 z-[1]">
        {/* Portrait orientation: tall screens */}
        <source
          media="(orientation: portrait)"
          srcSet={`${topoPortrait} 1x, ${topoPortrait2x} 2x`}
        />
        {/* Ultra-wide orientation: 21:9 aspect ratio and wider */}
        <source media="(min-aspect-ratio: 2/1)" srcSet={topoUltrawide} />
        {/* Default: landscape orientation */}
        <img
          src={topoLandscape}
          srcSet={`${topoLandscape} 1x, ${topoLandscape2x} 2x`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10"
        />
      </picture>

      {/* Base gradient overlay: diagonal from top-left to bottom-right */}
      <div className="fixed inset-0 bg-[linear-gradient(to_top_left,#000,70%,transparent)] z-[2]" />

      {/* Additional mobile-only gradients for better contrast */}
      {isMobile && (
        <>
          <div className="fixed inset-0 bg-[linear-gradient(to_top,transparent_80%,black)] z-[2]" />
          <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_90%,black)] z-[2]" />
        </>
      )}

      {/* =====================================================================
          Settings Panel
          ===================================================================== */}
      <SettingsPanel />

      {/* =====================================================================
          Main Content Area
          ===================================================================== */}

      {/* Render screen-specific content. Each screen reads party state from
          usePartyContext() directly; only local values and handlers are passed. */}
      {screen === "home" && (
        <HomeScreen isMobileLandscape={isMobileLandscape} />
      )}
      {screen === "join" && (
        <JoinScreen
          handleJoinLobby={handleJoinLobby}
          handleHostLobby={handleHostLobby}
          handleCancel={handleCancel}
        />
      )}
      {screen === "lobby" && (
        <LobbyScreen dimensions={mainDimensions} isMobile={isMobile} />
      )}
    </main>
  );
}
