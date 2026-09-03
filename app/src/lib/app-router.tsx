import type { ReactNode } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";

/** Packaged Electron loads `file://` — BrowserRouter pathname is the fs path, not `/studio`. */
export function isPackagedFileProtocol(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

export function ensurePackagedDefaultRoute(): void {
  if (!isPackagedFileProtocol()) return;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash === "/") {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", `${base}#/studio`);
  }
}

export function AppRouter({ children }: { children: ReactNode }) {
  ensurePackagedDefaultRoute();
  if (isPackagedFileProtocol()) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}
