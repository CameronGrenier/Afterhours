import { useEffect, useState, useRef } from "react";
import { Bolt, Undo2 } from "lucide-react";

// Background topology images with responsive variants
import topoLandscape from "@/assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "@/assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "@/assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "@/assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "@/assets/Images/topology_bg_images/topology-ultrawide.webp";

// Api related methods
import { socket } from "@/api/client";
import { createRoom, joinRoom, kickPlayer, leaveRoom } from "@/api/room";

// Components and hooks
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { setMusicVolume, setSfxVolume } from "@/lib/audio/audioSettings.js";
import {
  startLobbyMusic,
  stopLobbyMusic,
} from "@/lib/audio/lobbyMusicPlayer.js";
import { useToast } from "@/hooks/useToast";

import Panel from "@/components/Panel";
import Slider from "@/components/Slider.jsx";

import HomeScreen from "./HomeScreen.jsx";
import JoinScreen from "./JoinScreen.jsx";
import LobbyScreen from "./LobbyScreen.jsx";

/**
 * Main App Component
 *
 * Root component for the Afterhours application. Owns the top-level app state
 * (socket connection/SID, current screen, party code, username, player list)
 * and switches between the home, join, and lobby screens. Also renders the
 * responsive background imagery and the settings panel.
 */
export default function App() {
  const { error, warning } = useToast();

  // =========================================================================
  // Media Queries
  // =========================================================================
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMobileLandscape =
    useMediaQuery("(orientation: landscape)") && isMobile;

  // =========================================================================
  // State Management
  // =========================================================================
  const [sid, setSid] = useState(null); // Socket ID
  const [mode, setMode] = useState(null); // mode for the join screen determines which handler it uses: "host" | "join"
  const [screen, setScreen] = useState("home"); // Current screen: 'home', 'join', 'lobby'
  const [partyCode, setPartyCode] = useState(""); // Party code entered by user
  const [username, setUsername] = useState(""); // Formatted username
  const [players, setPlayers] = useState([]); // array of player usernames

  const [mainDimensions, setMainDimensions] = useState(null);

  const [sfxVolume, setSfxVolumeValue] = useState(50);
  const [musicVolume, setMusicVolumeValue] = useState(50);

  // =========================================================================
  // Refs
  // =========================================================================
  const mainRef = useRef(null);

  // =========================================================================
  // Listeners
  // =========================================================================

  // Keep the local player list in sync with the server. The backend emits
  // these to everyone in the room, including the player who just joined/left.
  useSocketEvent("player_joined", (data) => {
    setPlayers(data.all_players);
  });

  useSocketEvent("player_left", (data) => {
    setPlayers(data.all_players);
  });

  useSocketEvent("kicked", (data) => {
    warning(data?.message ?? "You were kicked from the room");
    setMode(null);
    setPartyCode("");
    setUsername("");
    setPlayers([]);
    setScreen("home");
  });

  // =========================================================================
  // Event Handlers
  // =========================================================================

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // Re-measure whenever the box resizes (window resize, orientation flip,
    // mobile URL-bar show/hide). The observer also fires once right after
    // observe(), so this covers the initial measurement too — no separate
    // getBoundingClientRect call needed on mount.
    const observer = new ResizeObserver(() => {
      setMainDimensions(el.getBoundingClientRect());
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Set SID on initial mount and when socket connects
  useEffect(() => {
    if (socket.connected) setSid(socket.id);
  }, []);
  useSocketEvent("connect", () => {
    setSid(socket.id);
  });

  /**
   * Handles user joining an existing party/lobby.
   *
   * PascalCases the username, sends the join request, stores the room code the
   * server returns, and moves to the lobby screen. Should only be called after
   * a username and party code have been provided.
   */
  async function handleJoinLobby() {
    const pascal = toPascalCase(username);
    setUsername(pascal);

    const response = await joinRoom(sid, partyCode, pascal);
    const status = response["status"]
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
   * Handles user creating a new lobby/party.
   *
   * PascalCases the username, asks the server to create a room, and on success
   * seeds the local party code and player list before moving to the lobby
   * screen. Alerts the user if the server returns no room code.
   */
  async function handleHostLobby() {
    const pascal = toPascalCase(username);
    setUsername(pascal);

    const response = await createRoom(sid, pascal);
    const status = response["status"]
    if (status !== "success") {
      error(`${status}: ${response["message"]}`);
      return;
    }
    const code = response["Room Code"];
    if (!code) {
      alert("Party code could not be generated. Try again later.");
      error("No party code returned from server");
    } else {
      setPartyCode(response["Room Code"]);
      setPlayers([pascal]);
      setScreen("lobby");
    }
  }

  /**
   * Resets the app state and returns to the home screen.
   *
   * Clears party code, username, and navigates back to the initial screen.
   * Used when user cancels joining a party.
   */
  function handleCancel() {
    setScreen("home");
    setPartyCode("");
    setUsername("");
  }

  /**
   * Leaves the current room and returns to the join screen.
   *
   * Notifies the server so the player is removed and the other clients receive
   * an updated player list.
   */
  function handleLeaveRoom() {
    leaveRoom(sid, partyCode, username);
    setScreen("join");
  }

  /**
   * Starts the current room/game.
   *
   * TODO: stub. Currently only alerts; needs to call the start_game endpoint.
   */
  function handleStartRoom() {
    alert("user wants to start the room");
  }

  function handleKickPlayer(targetUsername) {
    kickPlayer(sid, partyCode, targetUsername);
  }

  // =========================================================================
  // Utility Functions
  // =========================================================================

  /**
   * Converts a string to PascalCase format.
   *
   * Process:
   *   1. Replaces punctuation and non-alphanumeric characters with spaces
   *   2. Capitalizes the first letter of each word
   *   3. Removes all whitespace
   *
   * Example: "hello-world" → "HelloWorld"
   *
   * @param {string} str - The string to convert
   * @returns {string} The PascalCase formatted string
   */
  function toPascalCase(str) {
    return str
      .replace(/[^a-zA-Z0-9 ]/g, " ") // Turn punctuation/delimiters into spaces
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (match) => match.toUpperCase()) // Capitalize target letters
      .replace(/\s+/g, ""); // Strip all spaces
  }

  useEffect(() => {
    setSfxVolume(sfxVolume / 100);
  }, [sfxVolume]);

  useEffect(() => {
    setMusicVolume(musicVolume / 100);
  }, [musicVolume]);

  useEffect(() => {
    if (isMobile) {
      stopLobbyMusic();
      return;
    }

    function unlockLobbyMusic() {
      void startLobbyMusic();
    }

    window.addEventListener("pointerdown", unlockLobbyMusic, { once: true });
    window.addEventListener("keydown", unlockLobbyMusic, { once: true });

    void startLobbyMusic();

    return () => {
      window.removeEventListener("pointerdown", unlockLobbyMusic);
      window.removeEventListener("keydown", unlockLobbyMusic);
      stopLobbyMusic();
    };
  }, [isMobile]);

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
      <Panel
        position="tl"
        icon={<Bolt size={40} color="#ffffff" fill="#000000" />}
        header={
          <div className="w-full text-white font-bold text-4xl tracking-tight px-5 py-4">
            Settings
          </div>
        }
      >
        <Slider
          sliderTitle="SoundsFx Volume"
          value={sfxVolume}
          onChange={setSfxVolumeValue}
        />
        {!isMobile && (
          <Slider
            sliderTitle="Music Volume"
            value={musicVolume}
            onChange={setMusicVolumeValue}
          />
        )}
      </Panel>

      {/* =====================================================================
          Main Content Area
          ===================================================================== */}

      {/* Render screen-specific content */}
      {screen === "home" && (
        <HomeScreen
          isMobileLandscape={isMobileLandscape}
          partyCode={partyCode}
          setPartyCode={setPartyCode}
          setScreen={setScreen}
          setMode={setMode}
        />
      )}
      {screen === "join" && (
        <JoinScreen
          mode={mode}
          setUsername={setUsername}
          handleJoinLobby={handleJoinLobby}
          handleHostLobby={handleHostLobby}
          handleCancel={handleCancel}
        />
      )}
      {screen === "lobby" && (
        <LobbyScreen
          dimensions={mainDimensions}
          partyCode={partyCode}
          username={username}
          players={players}
          isMobile={isMobile}
          handleStartRoom={handleStartRoom}
          handleCancel={handleLeaveRoom}
          handleKickPlayer={handleKickPlayer}
        />
      )}
    </main>
  );
}
