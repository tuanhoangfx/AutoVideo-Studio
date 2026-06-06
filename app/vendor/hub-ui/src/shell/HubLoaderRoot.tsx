import { useEffect } from "react";
import { ensureHubTabLoaderRoot } from "../loading/hub-loader-dom";

export { ensureHubTabLoaderRoot, HUB_TAB_LOADER_ROOT_ID } from "../loading/hub-loader-dom";

/** Mounts loader portal on document.body (keeps orb centered in main pane). */
export function HubLoaderRoot() {
  useEffect(() => {
    ensureHubTabLoaderRoot();
  }, []);
  return null;
}
