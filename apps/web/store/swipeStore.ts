import { create } from "zustand";
import type { Opportunity } from "@torre-swipe/types";
import type { StorageStrategy } from "@torre-swipe/types";
import { logger } from "../lib/logger";

export type SwipeAction = "like" | "pass" | "super";

const MAX_QUEUE_SIZE = 50;

type SwipeStore = {
  // Queue
  queue: Opportunity[];
  seenIds: Set<string>;
  isFetching: boolean;
  fetchError: string | null;

  // Undo
  undoCard: Opportunity | null;
  undoAction: SwipeAction | null;

  // UI state
  isAnimating: boolean;
  isCelebrating: boolean;

  // Storage
  storage: StorageStrategy | null;

  // Actions
  addCards: (cards: Opportunity[]) => void;
  swipe: (action: SwipeAction) => void;
  undo: () => void;
  setFetching: (v: boolean) => void;
  setFetchError: (msg: string | null) => void;
  setAnimating: (v: boolean) => void;
  setCelebrating: (v: boolean) => void;
};

export const useSwipeStore = create<SwipeStore>((set) => ({
  queue: [],
  seenIds: new Set(),
  isFetching: false,
  fetchError: null,
  undoCard: null,
  undoAction: null,
  isAnimating: false,
  isCelebrating: false,
  storage: null,

  addCards: (cards) => {
    set((state) => {
      const fresh = cards.filter((c) => !state.seenIds.has(c.id));
      const merged = [...state.queue, ...fresh].slice(0, MAX_QUEUE_SIZE);
      logger.info("addCards", { added: fresh.length, queueSize: merged.length });
      return { queue: merged };
    });
  },

  swipe: (action) => {
    set((state) => {
      if (state.queue.length === 0) return state;
      const [top, ...rest] = state.queue;
      const newSeenIds = new Set(state.seenIds);
      newSeenIds.add(top.id);
      logger.info("swipe", { action, cardId: top.id, queueRemaining: rest.length });
      // Persist fire-and-forget
      state.storage?.saveSeenIds(newSeenIds).catch(() => {});
      return {
        queue: rest,
        seenIds: newSeenIds,
        undoCard: top,
        undoAction: action,
        isCelebrating: action === "super" ? true : state.isCelebrating,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (!state.undoCard) {
        logger.info("undo: no card to restore");
        return state;
      }
      const restoredId = state.undoCard.id;
      const newSeenIds = new Set(state.seenIds);
      newSeenIds.delete(restoredId);
      logger.info("undo", { cardId: restoredId });
      return {
        queue: [state.undoCard, ...state.queue],
        seenIds: newSeenIds,
        undoCard: null,
        undoAction: null,
      };
    });
  },

  setFetching: (v) => set({ isFetching: v }),
  setFetchError: (msg) => set({ fetchError: msg }),
  setAnimating: (v) => set({ isAnimating: v }),
  setCelebrating: (v) => set({ isCelebrating: v }),
}));

export function initSwipeStore(storage: StorageStrategy): void {
  storage.loadSeenIds().then((ids) => {
    logger.info("initSwipeStore: loaded seenIds", { count: ids.size });
    useSwipeStore.setState({ seenIds: ids, storage });
  }).catch(() => {
    useSwipeStore.setState({ storage });
  });
}
