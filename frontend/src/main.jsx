
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { migrateDataToSupabase } from "./utils/migrateToSupabase.js";
import "./index.css";

// Expose migration function to window for manual triggering
window.migrateDataToSupabase = migrateDataToSupabase;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

