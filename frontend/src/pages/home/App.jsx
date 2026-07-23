import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Add useNavigate

// Background topology images...
import topoLandscape from "@/assets/Images/topology_bg_images/topology-landscape.webp";
import topoLandscape2x from "@/assets/Images/topology_bg_images/topology-landscape@2x.webp";
import topoPortrait from "@/assets/Images/topology_bg_images/topology-portrait.webp";
import topoPortrait2x from "@/assets/Images/topology_bg_images/topology-portrait@2x.webp";
import topoUltrawide from "@/assets/Images/topology_bg_images/topology-ultrawide.webp";

// API & Context hooks
import { request, socket } from "@/api/client";
import { createRoom, joinRoom } from "@/api/room";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { usePartyContext } from "@/hooks/usePartyContext.js";

import SettingsPanel from "@/components/SettingsPanel.jsx";
import HomeScreen from "./HomeScreen.jsx";
import JoinScreen from "./JoinScreen.jsx";

export default function App() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMobileLandscape = useMediaQuery(
    "(orientation: landscape) and (max-height: 500px)"
  );

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
    warning,
    error,
    setServerTimeOffset,
  } = usePartyContext();

  const [mainDimensions, setMainDimensions] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setMainDimensions(el.getBoundingClientRect());
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

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
    setServerTimeOffset(response["Server Time"] - Date.now() / 1000);

    navigate("/lobby"); // Navigate to lobby route
  }

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
      setServerTimeOffset(response["Server Time"] - Date.now() / 1000);
      setPlayers([pascal]);
      
      navigate("/lobby"); // Navigate to lobby route
    }
  }

  function handleCancel() {
    setIsHost(false);
    setScreen("home");
    setPartyCode("");
    setUsername("");
  }

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

      <div className="fixed inset-0 bg-[linear-gradient(to_top_left,#000,70%,transparent)] z-[2]" />

      {isMobile && (
        <>
          <div className="fixed inset-0 bg-[linear-gradient(to_top,transparent_80%,black)] z-[2]" />
          <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_90%,black)] z-[2]" />
        </>
      )}

      <SettingsPanel />

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
    </main>
  );
}