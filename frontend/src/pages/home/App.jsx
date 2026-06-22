import { useState } from "react";
import { Bolt, Undo2 } from "lucide-react";

// Background topology images with responsive variants
import topoLandscape from "@/assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "@/assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "@/assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "@/assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "@/assets/Images/topology_bg_images/topology-ultrawide.webp";

// Components and hooks
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Panel from "@/components/Panel";

import HomeScreen from "./HomeScreen.jsx";
import JoinScreen from "./JoinScreen.jsx";

/**
 * Main App Component
 *
 * The root component for the Afterhours application. Manages navigation between
 * different screens (home, join, lobby, room) and handles user authentication.
 * Renders responsive background imagery, a settings panel, and screen-specific content.
 */
export default function App() {
  // =========================================================================
  // Media Queries
  // =========================================================================
  const isMobile = useMediaQuery("(max-width: 768px), (max-height: 768px)");
  const isMobileLandscape =
    useMediaQuery("(orientation: landscape)") && isMobile;

  // =========================================================================
  // State Management
  // =========================================================================
  const [screen, setScreen] = useState("home"); // Current screen: 'home', 'join', 'lobby'
  const [partyCode, setPartyCode] = useState(""); // Party code entered by user
  const [username, setUsername] = useState(""); // Formatted username

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handles user joining an existing party/lobby.
   *
   * Converts the username to PascalCase format before joining.
   * Should only be called after username and party code are provided.
   * Currently triggers an alert; should be replaced with backend API call.
   */
  function handleJoinLobby() {
    const pascal = toPascalCase(username);
    setUsername(pascal);
    alert(`user wants to join party ${partyCode} with username ${pascal}`);
  }

  /**
   * Handles user creating a new lobby/party.
   *
   * Transitions the user from the home screen to the join screen.
   * Currently triggers an alert; should be replaced with backend API call.
   */
  function handleCreateLobby() {
    alert(
      `user wants to create a lobby... handle the backend call to create a lobby now`,
    );
    setScreen("join");
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

  return (
    <main className="relative w-screen h-dvh px-8 flex flex-col items-center justify-center bg-black overflow-hidden">
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
      />

      {/* =====================================================================
          Main Content Area
          ===================================================================== */}
      <div className="w-full max-w-[400px] flex flex-col gap-4 opacity-100 z-[3]">
        <h1 className="text-4xl font-bold text-white font-display uppercase text-center leading-none">
          afterhours
        </h1>

        {/* Render screen-specific content */}
        {screen === "home" && (
          <HomeScreen
            isMobileLandscape={isMobileLandscape}
            setPartyCode={setPartyCode}
            setScreen={setScreen}
            handleCreateLobby={handleCreateLobby}
            handleJoinLobby={handleJoinLobby}
          />
        )}
        {screen === "join" && (
          <JoinScreen
            setUsername={setUsername}
            handleJoinLobby={handleJoinLobby}
            handleCancel={handleCancel}
          />
        )}
      </div>
    </main>
  );
}
