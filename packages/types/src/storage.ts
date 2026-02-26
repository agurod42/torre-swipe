export interface StorageStrategy {
  /** Load the set of already-seen opportunity IDs. */
  loadSeenIds(): Promise<Set<string>>;
  /** Persist the updated set of seen IDs. */
  saveSeenIds(ids: Set<string>): Promise<void>;
}
