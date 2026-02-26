const enabled = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";

export const logger = {
  info: (...args: unknown[]): void => {
    if (enabled) console.log("[web:info]", ...args);
  },
  warn: (...args: unknown[]): void => {
    if (enabled) console.warn("[web:warn]", ...args);
  },
  error: (...args: unknown[]): void => {
    if (enabled) console.error("[web:error]", ...args);
  },
};
