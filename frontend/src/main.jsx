import { StrictMode, useContext } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./pages/home/App.jsx";
import TestPage from "./pages/test/TestPage.jsx";
import RoomPage from "./pages/room/RoomPage.jsx";
import LobbyPage from "./pages/LobbyPage/LobbyPage.jsx";
import CrashOutPage from "./pages/crashOut/CrashOut.jsx";
import SlangPage from "./pages/slang/SlangPage.jsx";

import { PartyProvider } from "./components/PartyProvider.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { CrashOutProvider } from "./components/CrashOutProvider.jsx";

/**
 * Application Entry Point
 *
 * Initializes the React application with:
 *   - StrictMode: Highlights potential issues in development
 *   - BrowserRouter: Enables client-side routing
 *   - Routes: Application route configuration
 *
 * Routes:
 *   - "/"     - Landing page
 *   - "/room" - Main room page for selecting games
 *   - "/test" - Component testing page
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <PartyProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<App />} />
            {/* Lobby Page */}
            <Route path="/lobby" element={<LobbyPage/>} />
            {/* Room Page */}
            <Route path="/room" element={<RoomPage />} />
            {/* CrashOut Game Page — CrashOutProvider is scoped here so its
                global game_update/END_GAME handling only runs on this route */}
            <Route
              path="/crashout"
              element={
                <CrashOutProvider>
                  <CrashOutPage />
                </CrashOutProvider>
              }
            />
            {/* Slang Game Page */}
            <Route path="/slang" element={<SlangPage />} />
            {/* Component Testing Page */}
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </PartyProvider>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
);
