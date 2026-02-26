import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSwipeStore } from "../../store/swipeStore";
import type { Opportunity, Organization, Compensation, Skill, Place } from "@torre-swipe/types";
import type { StorageStrategy } from "@torre-swipe/types";

const mockOrg: Organization = {
  id: 1, hashedId: "a", name: "Acme", status: "active", size: 10,
  publicId: "acme", picture: "https://example.com/logo.png", theme: "#fff",
};
const mockComp: Compensation = {
  data: { code: "range", currency: "USD", minAmount: 100000, minHourlyUSD: 48,
    maxAmount: 150000, maxHourlyUSD: 72, periodicity: "yearly", negotiable: false, conversionRateUSD: 1 },
  visible: true, additionalCompensationDetails: {},
};
const mockSkill: Skill = { name: "React", experience: "applying", proficiency: "proficient" };
const mockPlace: Place = { remote: true, anywhere: true, timezone: false, locationType: "anywhere", location: [] };

function makeOpp(id: string): Opportunity {
  return {
    id, objective: `Job ${id}`, slug: id, tagline: "Great job", theme: "#000",
    type: "full-time-employment", opportunity: "employee",
    organizations: [mockOrg], locations: ["USA"], timezones: null,
    remote: true, external: false, deadline: null,
    created: "2024-01-01T00:00:00Z", status: "open", commitment: "full-time",
    externalApplicationUrl: `https://example.com/${id}`,
    compensation: mockComp, skills: [mockSkill], place: mockPlace,
  };
}

const mockStorage: StorageStrategy = {
  loadSeenIds: vi.fn().mockResolvedValue(new Set<string>()),
  saveSeenIds: vi.fn().mockResolvedValue(undefined),
};

function resetStore() {
  useSwipeStore.setState({
    queue: [], seenIds: new Set(), isFetching: false, fetchError: null,
    undoCard: null, undoAction: null, isAnimating: false, isCelebrating: false,
    storage: mockStorage,
  });
}

describe("swipeStore", () => {
  beforeEach(resetStore);

  describe("addCards", () => {
    it("appends new cards to the queue", () => {
      const { addCards } = useSwipeStore.getState();
      addCards([makeOpp("1"), makeOpp("2")]);
      expect(useSwipeStore.getState().queue).toHaveLength(2);
    });

    it("deduplicates cards already in seenIds", () => {
      useSwipeStore.setState({ seenIds: new Set(["1"]) });
      const { addCards } = useSwipeStore.getState();
      addCards([makeOpp("1"), makeOpp("2")]);
      expect(useSwipeStore.getState().queue).toHaveLength(1);
      expect(useSwipeStore.getState().queue[0].id).toBe("2");
    });

    it("respects MAX_QUEUE_SIZE of 50", () => {
      const { addCards } = useSwipeStore.getState();
      const cards = Array.from({ length: 60 }, (_, i) => makeOpp(String(i)));
      addCards(cards);
      expect(useSwipeStore.getState().queue).toHaveLength(50);
    });
  });

  describe("swipe", () => {
    beforeEach(() => {
      const { addCards } = useSwipeStore.getState();
      addCards([makeOpp("1"), makeOpp("2"), makeOpp("3")]);
    });

    it("swipe(like): removes top card, saves undoCard", () => {
      const { swipe } = useSwipeStore.getState();
      swipe("like");
      const state = useSwipeStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].id).toBe("2");
      expect(state.undoCard?.id).toBe("1");
      expect(state.undoAction).toBe("like");
    });

    it("swipe(pass): removes top card, saves undoCard", () => {
      const { swipe } = useSwipeStore.getState();
      swipe("pass");
      const state = useSwipeStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.undoCard?.id).toBe("1");
      expect(state.undoAction).toBe("pass");
    });

    it("swipe(super): removes top card, sets isCelebrating=true", () => {
      const { swipe } = useSwipeStore.getState();
      swipe("super");
      const state = useSwipeStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.isCelebrating).toBe(true);
    });

    it("swipe adds card id to seenIds", () => {
      const { swipe } = useSwipeStore.getState();
      swipe("like");
      expect(useSwipeStore.getState().seenIds.has("1")).toBe(true);
    });

    it("swipe persists seenIds via storage (fire-and-forget)", () => {
      const { swipe } = useSwipeStore.getState();
      swipe("like");
      expect(mockStorage.saveSeenIds).toHaveBeenCalled();
    });

    it("swipe on empty queue is a no-op", () => {
      useSwipeStore.setState({ queue: [] });
      const { swipe } = useSwipeStore.getState();
      swipe("like");
      expect(useSwipeStore.getState().undoCard).toBeNull();
    });
  });

  describe("undo", () => {
    it("restores top card from undoCard", () => {
      const opp1 = makeOpp("1");
      const opp2 = makeOpp("2");
      useSwipeStore.setState({
        queue: [opp2],
        undoCard: opp1,
        undoAction: "like",
        seenIds: new Set(["1"]),
      });
      const { undo } = useSwipeStore.getState();
      undo();
      const state = useSwipeStore.getState();
      expect(state.queue[0].id).toBe("1");
      expect(state.queue[1].id).toBe("2");
      expect(state.undoCard).toBeNull();
      expect(state.undoAction).toBeNull();
    });

    it("removes restored card id from seenIds", () => {
      const opp1 = makeOpp("1");
      useSwipeStore.setState({ queue: [], undoCard: opp1, seenIds: new Set(["1"]) });
      const { undo } = useSwipeStore.getState();
      undo();
      expect(useSwipeStore.getState().seenIds.has("1")).toBe(false);
    });

    it("undo when undoCard is null is a no-op", () => {
      useSwipeStore.setState({ queue: [makeOpp("2")], undoCard: null });
      const { undo } = useSwipeStore.getState();
      undo();
      expect(useSwipeStore.getState().queue).toHaveLength(1);
    });
  });

  describe("setters", () => {
    it("setFetching toggles isFetching", () => {
      useSwipeStore.getState().setFetching(true);
      expect(useSwipeStore.getState().isFetching).toBe(true);
    });
    it("setAnimating toggles isAnimating", () => {
      useSwipeStore.getState().setAnimating(true);
      expect(useSwipeStore.getState().isAnimating).toBe(true);
    });
    it("setCelebrating toggles isCelebrating", () => {
      useSwipeStore.getState().setCelebrating(true);
      expect(useSwipeStore.getState().isCelebrating).toBe(true);
    });
  });
});
