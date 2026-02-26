import { logger } from "./logger";

const NEW_TAB_TARGET = "_blank";
const NEW_TAB_FEATURES = "noopener,noreferrer";

export function openExternalApplication(url: string | null | undefined): void {
  if (!url || typeof window === "undefined") {
    return;
  }

  const newTab = window.open(url, NEW_TAB_TARGET, NEW_TAB_FEATURES);
  if (!newTab) {
    logger.warn("openExternalApplication: popup blocked", { url });
  }
}
