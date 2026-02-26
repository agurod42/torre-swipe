import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipeStore } from "../../store/swipeStore";
import type { Opportunity, Organization, Compensation, Skill, Place } from "@torre-swipe/types";

// Mock the api module
vi.mock("../../lib/api", () => ({
  fetchOpportunities: vi.fn(),
}));

import { fetchOpportunities } from "../../lib/api";
import { useSwipeQueue } from "../../hooks/useSwipeQueue";

const mockFetch = fetchOpportunities as ReturnType<typeof vi.fn>;

const mockOrg: Organization = {
  id: 1, hashedId: "a", name: "Acme", status: "active", size: 10,
  publicId: "acme", picture: "https://example.com/logo.png", theme: "#fff",
};
const mockComp: Compensation = {
  data: { code: "range", currency: "USD", minAmount: 100000, minHourlyUSD: 48,
    maxAmount: 150000, maxHourlyUSD: 72, periodicity: "yearly", negotiable: false, conversionRateUSD: 1 },
  visible: true, additionalCompensationDetails: {},
};
const mockPlace: Place = { remote: true, anywhere: true, timezone: false, locationType: "anywhere", location: [] };

function makeOpp(id: string): Opportunity {
  return {
    id, objective: `Job ${id}`, slug: id, tagline: "", theme: "#000",
    type: "full-time-employment", opportunity: "employee",
    organizations: [mockOrg], locations: [], timezones: null,
    remote: false, external: false, deadline: null,
    created: "2024-01-01T00:00:00Z", status: "open", commitment: "full-time",
    externalApplicationUrl: null, compensation: mockComp,
    skills: [] as Skill[], place: mockPlace,
  };
}

function resetStore() {
  useSwipeStore.setState({
    queue: [], seenIds: new Set(), isFetching: false, fetchError: null,
    undoCard: null, undoAction: null, isAnimating: false, isCelebrating: false, storage: null,
  });
}

describe("useSwipeQueue", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it("triggers initial fetch on mount when queue is empty", async () => {
    const results = Array.from({ length: 5 }, (_, i) => makeOpp(String(i)));
    mockFetch.mockResolvedValueOnce({ total: 5, size: 5, results });

    await act(async () => {
      renderHook(() => useSwipeQueue());
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(useSwipeStore.getState().queue).toHaveLength(5);
  });

  it("does not fetch again when queue already has cards", async () => {
    useSwipeStore.setState({ queue: [makeOpp("existing")] });
    mockFetch.mockResolvedValueOnce({ total: 0, size: 0, results: [] });

    await act(async () => {
      renderHook(() => useSwipeQueue());
    });

    // Should not have fetched (queue was non-empty)
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("filters out seenIds from fetch results", async () => {
    useSwipeStore.setState({ seenIds: new Set(["0", "1"]) });
    const results = Array.from({ length: 5 }, (_, i) => makeOpp(String(i)));
    mockFetch.mockResolvedValueOnce({ total: 5, size: 5, results });

    await act(async () => {
      renderHook(() => useSwipeQueue());
    });

    // Cards 0 and 1 should be filtered out
    const queueIds = useSwipeStore.getState().queue.map((c) => c.id);
    expect(queueIds).not.toContain("0");
    expect(queueIds).not.toContain("1");
    expect(queueIds).toHaveLength(3);
  });

  it("sets fetchError on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      renderHook(() => useSwipeQueue());
    });

    expect(useSwipeStore.getState().fetchError).toBeTruthy();
    expect(useSwipeStore.getState().isFetching).toBe(false);
  });

  it("exposes fetchMore function", () => {
    const { result } = renderHook(() => useSwipeQueue());
    expect(typeof result.current.fetchMore).toBe("function");
  });
});
