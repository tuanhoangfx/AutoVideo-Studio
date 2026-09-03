import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initHubUserZoom } from "@tool-workspace/hub-ui/hub-user-zoom";
import { mountHubApp } from "@tool-workspace/hub-ui/loading/mount-hub-app";
import { AppRouter } from "./lib/app-router";
import App from "./App";
import "./app/globals.css";

declare global {
  interface Window {
    __p0021Boot?: string;
    __P0021_LAST_ERROR?: string;
  }
}

window.__p0021Boot = "booting";

window.addEventListener("error", (e) => {
  window.__P0021_LAST_ERROR =
    (e as ErrorEvent)?.error?.stack ||
    (e as ErrorEvent)?.error?.message ||
    (e as ErrorEvent)?.message ||
    "error";
});
window.addEventListener("unhandledrejection", (e) => {
  const reason = (e as PromiseRejectionEvent)?.reason;
  window.__P0021_LAST_ERROR =
    reason instanceof Error ? reason.stack || reason.message : String(reason ?? "rejection");
});

initHubUserZoom();

const rootEl = document.getElementById("root");
if (!rootEl) {
  window.__p0021Boot = "missing-root";
  throw new Error("#root not found");
}

window.__p0021Boot = "rendering";
mountHubApp(rootEl, () => {
  createRoot(rootEl).render(
    <StrictMode>
      <AppRouter>
        <App />
      </AppRouter>
    </StrictMode>,
  );
  window.__p0021Boot = "ready";
});
