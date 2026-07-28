import { useState, useEffect } from "react";

import { PartyContext } from "./PartyContext";
import { useNavigate } from 'react-router-dom'; 
import { useToast } from "@/hooks/useToast";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { kickPlayer } from "@/api/room";
import { setMusicVolume, setSfxVolume } from "@/lib/audio/audioSettings.js";
import {
  startLobbyMusic,
  stopLobbyMusic,
} from "@/lib/audio/lobbyMusicPlayer.js";

export function PartyProvider({ children }) {
  const { success, warning, error, info, dismiss } = useToast();

  // =========================================================================
  // State Management
  // =========================================================================
  const [sid, setSid] = useState(null); // Socket ID
  const [leaderboard, setLeaderboard] = useState([]); // Socket ID
  const [isHost, setIsHost] = useState(false); // Flag if the user is the host of the room
  const navigate = useNavigate();
  const [rotateDialogDismissed, setRotateDialogDismissed] = useState(() => { // Flag to track if the user has seen and dismissed a que to rotate out of landscape mobile
    return localStorage.getItem("rotateDialogDismissed") ?? "true"; // load from local storage to persist this setting across refreshes
  }); 
  useEffect(() => {localStorage.setItem("rotateDialogDismissed", rotateDialogDismissed)}, [rotateDialogDismissed]); // update local storage if this changes

  const [mode, setMode] = useState(null); // Mode for the join screen determines which handler it uses: "host" | "join"
  const [screen, setScreen] = useState("home"); // Current screen: 'home', 'join', 'lobby'
  const [partyCode, setPartyCode] = useState(""); // Party code entered by user
  const [gamePhase, setGamePhase] = useState("None"); // Current game phase: 'None', 'Betting', 'Playing'
  const [username, setUsername] = useState(""); // Formatted username
  const [players, setPlayers] = useState([]); // array of player usernames
  const [serverTimeOffset, setServerTimeOffset] = useState(0); // Offset between server time and local time in seconds
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sfxVolume, setSfxVolumeValue] = useState(50);
  const [musicVolume, setMusicVolumeValue] = useState(50);

  // =========================================================================
  // Socket Event Listeners
  // =========================================================================

  // Keep the local player list in sync with the server. The backend emits
  // these to everyone in the room, including the player who just joined/left.
  useSocketEvent("player_joined", (data) => {
    setPlayers(data.all_players);
  });

  useSocketEvent("player_left", (data) => {
    setPlayers(data.all_players);
  });

  useSocketEvent("lobby_update", (data) => {
    const selectedGame = data?.game;
    // console.log("[PartyProvider] lobby_update received:", data, "-> selectedGame:", selectedGame);

    if (selectedGame === "Crash Out") {
      navigate("/crashout");
    } else if (selectedGame === "Slang") {
      navigate("/slang");
    } else {
      navigate("/room");
    }
  });

  // Authoritative game-start navigation for every player.
  //
  // The backend broadcasts `game_update`/START_GAME to all players in the room
  // when a game begins, so this reliably routes hosts and non-hosts alike. We
  // route by the game name in the payload instead of a hardcoded destination.
  //
  // The `lobby_update` handler above is the *intended* router, but it only runs
  // when the host-only `select_game` check succeeds — which currently fails, so
  // `lobby_update` never reaches clients. START_GAME is the dependable signal,
  // and it's what non-host players receive, so we navigate off it here.
  useSocketEvent("game_update", (data) => {
    // console.log("[PartyProvider] game_update received:", data);
    if (data?.type !== "START_GAME") return;

    const game = data?.payload?.game;
    // console.log("[PartyProvider] START_GAME payload.game =", game);
    if (game === "Crash Out") {
      navigate("/crashout");
    } else if (game === "Slang!" || game === "Slang") {
      // SlangPage seeds its initial seating state from this payload.
      navigate("/slang", { state: { gameState: data.payload } });
    }
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
  // Audio Handling
  // =========================================================================

  // Push volume changes through to the audio layer.
  useEffect(() => {
    setSfxVolume(sfxVolume / 100);
  }, [sfxVolume]);

  useEffect(() => {
    setMusicVolume(musicVolume / 100);
  }, [musicVolume]);

  // Lobby music is desktop-only. Browsers block autoplay until the first user
  // gesture, so prime playback on the first pointer/key event as a fallback.
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

  /**
   * Kicks a player. Surfaces an error toast if the server returns one.
   *
   * @param {string} targetUsername
   */
  async function handleKickPlayer(targetUsername) {
    const response = await kickPlayer(sid, partyCode, targetUsername);
    if (response["status"] !== "success") {
      error(`${response["message"]}`);
    }
  }

  const value = {
    sid,
    setSid,
    isHost,
    setIsHost,
    rotateDialogDismissed,
    setRotateDialogDismissed,
    isMobile,
    mode,
    setMode,
    screen,
    setScreen,
    partyCode,
    setPartyCode,
    username,
    setUsername,
    players,
    setPlayers,
    sfxVolume,
    setSfxVolumeValue,
    musicVolume,
    setMusicVolumeValue,
    success,
    warning,
    error,
    info,
    dismiss,
    handleKickPlayer,
    setServerTimeOffset,
    serverTimeOffset,
    leaderboard,
    setLeaderboard,
  };

  return (
    <PartyContext.Provider value={value}>{children}</PartyContext.Provider>
  );
}
