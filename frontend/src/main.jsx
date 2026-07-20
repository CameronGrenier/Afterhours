import { StrictMode, useContext } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./pages/home/App.jsx";
import TestPage from "./pages/test/TestPage.jsx";
import RoomPage from "./pages/room/RoomPage.jsx";
import CrashOutPage from "./pages/crashOut/CrashOut.jsx";

import { PartyProvider } from "./components/PartyProvider.jsx";
import { ToastProvider } from "./components/Toast.jsx";

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
      <PartyProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<App />} />
            {/* Room Page */}
            <Route path="/room" element={<RoomPage />} />
            {/* CrashOut Game Page */}
            <Route path="/crashout" element={<CrashOutPage />} />

            {/* Component Testing Page */}
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </BrowserRouter>
      </PartyProvider>
    </ToastProvider>
  </StrictMode>,
);
