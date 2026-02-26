"use client";

import { useEffect, useRef } from "react";
import { useSwipeStore } from "../store/swipeStore";
import { fetchOpportunities } from "../lib/api";
import { logger } from "../lib/logger";
import type { Opportunity } from "@torre-swipe/types";

const INITIAL_FETCH_SIZE = 20;
const REFILL_SIZE = 10;
const REFILL_THRESHOLD = 5;

function preloadImages(cards: Opportunity[], count = 5): void {
  cards.slice(0, count).forEach((card) => {
    const url = card.organizations[0]?.picture;
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
}

export function useSwipeQueue() {
  const { queue, seenIds, isFetching, addCards, setFetching, setFetchError } =
    useSwipeStore();
  const initialFetchDone = useRef(false);

  async function fetchMore(size: number): Promise<void> {
    logger.info("fetchMore triggered", { size, queueLength: queue.length });
    setFetching(true);
    setFetchError(null);
    try {
      const data = await fetchOpportunities({ size, currency: "USD", periodicity: "yearly" });
      const fresh = data.results.filter((r) => !seenIds.has(r.id));
      logger.info("fetchMore result", { fetched: data.results.length, fresh: fresh.length });
      addCards(fresh);
      preloadImages(fresh);
    } catch (err) {
      logger.error("fetchMore failed", err);
      setFetchError(String(err));
    } finally {
      setFetching(false);
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    if (!initialFetchDone.current && queue.length === 0 && !isFetching) {
      initialFetchDone.current = true;
      void fetchMore(INITIAL_FETCH_SIZE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refill when queue drops below threshold
  useEffect(() => {
    if (
      initialFetchDone.current &&
      queue.length > 0 &&
      queue.length < REFILL_THRESHOLD &&
      !isFetching
    ) {
      void fetchMore(REFILL_SIZE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  return { fetchMore: (size = INITIAL_FETCH_SIZE) => fetchMore(size) };
}
