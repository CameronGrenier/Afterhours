import { useState } from "react";
import { Bolt, Undo2 } from "lucide-react";

// Background topology images with responsive variants
import topoLandscape from "./assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "./assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "./assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "./assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "./assets/Images/topology_bg_images/topology-ultrawide.webp";

// Components and hooks
import { useMediaQuery } from "./hooks/useMediaQuery";
import Panel from "./components/Panel";
import Surface from "./components/Surface";
import Button from "./components/Button";
import Input from "./components/Input";
import Arrow from "./components/Arrow";

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
  const [screen, setScreen] = useState("home"); // Current screen: 'home', 'join', 'lobby', 'room'
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
        {screen === "home" && HomeScreenComponent()}
        {screen === "join" && JoinScreenComponent()}
      </div>
    </main>
  );

  /**
   * Renders the home screen with "Host" and "Join" options.
   *
   * Displays:
   *   - Host button: creates a new party
   *   - Join form: party code input and join button
   *   - Annotations: helpful labels pointing to key UI elements
   *
   * @returns {React.ReactNode} Home screen content
   */
  function HomeScreenComponent() {
    return (
      <>
        {/* Host Button Section */}
        <div className="relative w-full">
          <Button variant={"dark"} onClick={() => handleCreateLobby()}>
            Host
          </Button>
          {/* Responsive annotation for Host button */}
          {isMobileLandscape ? (
            <Annotation
              d="M 60 72 C 60 54 60 15 8 8"
              label="Best on larger screens"
              className="right-0 bottom-0 translate-x-[110%] translate-y-[55%]"
              labelClassName="bottom-0 left-0 max-w-[20ch] rotate-18"
              width={150}
              height={170}
            />
          ) : (
            <Annotation
              d="M 80 27 C 86 35 112 51 96 101"
              label="Best on larger screens"
              className="right-0 top-0 translate-x-[10%] -translate-y-[110%]"
              labelClassName="top-0 right-0 max-w-[30ch] -rotate-18"
              width={140}
              height={170}
            />
          )}
        </div>

        {/* Join Party Form Section */}
        <Surface>
          <div className="relative flex flex-col gap-2">
            {/* Party code input field */}
            <Input
              type="text"
              placeholderText="Party Code"
              onChange={(inputText) => setPartyCode(inputText)}
              className="uppercase placeholder:lowercase"
            />

            {/* Join button */}
            <Button
              variant="dark"
              onClick={() => {
                setScreen("join");
              }}
            >
              Join
            </Button>

            {/* Responsive annotation for Join form */}
            {isMobileLandscape ? (
              <Annotation
                d="M 60 72 C 60 54 60 15 112 8"
                label="Connect on mobile"
                className="left-0 bottom-0 -translate-x-[130%] translate-y-[0%]"
                labelClassName="bottom-0 right-0 max-w-[7ch] -rotate-18"
                width={140}
                height={170}
              />
            ) : (
              <Annotation
                d="M 60 72 C 40 54 42 26 50 8"
                label="Connect on mobile"
                className="left-0 bottom-0 -translate-x-[50%] translate-y-[100%]"
                labelClassName="bottom-0 right-0 max-w-[7ch] -rotate-18"
                width={140}
                height={170}
              />
            )}
          </div>
        </Surface>
      </>
    );
  }

  /**
   * Renders the join screen with username input and confirmation.
   *
   * Displays:
   *   - Username input field
   *   - Join button: submits username and party code
   *   - Cancel button: returns to home screen
   *
   * @returns {React.ReactNode} Join screen content
   */
  function JoinScreenComponent() {
    return (
      <Surface>
        <div className="flex flex-col gap-2">
          {/* Username input field */}
          <Input
            type="text"
            placeholderText="Username"
            onChange={setUsername}
          />

          {/* Confirm join button */}
          <Button variant="dark" onClick={() => handleJoinLobby()}>
            Join
          </Button>

          {/* Return to home screen button */}
          <Button variant="danger" onClick={() => handleCancel()}>
            <div className="flex gap-2 items-center w-fit mx-auto">
              <Undo2 size={20} strokeWidth={3.2} />
              <span>Cancel</span>
            </div>
          </Button>
        </div>
      </Surface>
    );
  }
}

/**
 * Annotation Component
 *
 * Renders a decorative SVG line with a text label to annotate UI elements.
 * Used to highlight important features on the home screen.
 *
 * @param {string} d - SVG path data for the arrow line
 * @param {string} label - Text label to display
 * @param {string} className - Position and layout classes for the annotation container
 * @param {string} labelClassName - Text positioning and styling classes
 * @param {number} width - Width of the annotation container
 * @param {number} height - Height of the annotation container
 * @returns {React.ReactNode} Annotation element
 */

function Annotation({ d, label, className, labelClassName, width, height }) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`pointer-events-none absolute ${className}`}
    >
      {/* SVG line/arrow pointing to the annotated element */}
      <Arrow
        d={d}
        className="text-white absolute inset-0 w-full h-full"
      />

      {/* Text label for the annotation */}
      <span
        className={`absolute font-thin text-xl text-white leading-[1] tracking-tight text-center ${labelClassName}`}
      >
        {label}
      </span>
    </div>
  );
}
