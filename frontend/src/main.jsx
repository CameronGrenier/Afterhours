import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./pages/home/App.jsx";
import TestPage from "./pages/test/TestPage.jsx";
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
 *   - "/" - Main Afterhours application
 *   - "/test" - Component testing page
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Application */}
          <Route path="/" element={<App />} />

          {/* Component Testing Page */}
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>
);
