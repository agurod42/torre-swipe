import type { StorageStrategy } from "@torre-swipe/types";

const KEY = "torre_seen_ids";
const MAX_ENTRIES = 500;

export class LocalStorageStrategy implements StorageStrategy {
  async loadSeenIds(): Promise<Set<string>> {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return new Set<string>();
      return new Set<string>(JSON.parse(raw) as string[]);
    } catch {
      return new Set<string>();
    }
  }

  async saveSeenIds(ids: Set<string>): Promise<void> {
    try {
      let entries = [...ids];
      if (entries.length > MAX_ENTRIES) {
        entries = entries.slice(entries.length - MAX_ENTRIES);
      }
      localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded) — silently ignore
    }
  }
}
