const enabled = process.env.DEBUG_LOGS === "true";

export const logger = {
  info: (...args: unknown[]): void => {
    if (enabled) console.log("[api:info]", ...args);
  },
  warn: (...args: unknown[]): void => {
    if (enabled) console.warn("[api:warn]", ...args);
  },
  error: (...args: unknown[]): void => {
    if (enabled) console.error("[api:error]", ...args);
  },
};
