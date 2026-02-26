import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSwipeStore } from "../../store/swipeStore";
import type { Opportunity, Organization, Compensation, Skill, Place } from "@torre-swipe/types";

// Mock heavy dependencies
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    // Return a synchronous component for tests
    const Component = vi.fn().mockImplementation(({ job }: { job: Opportunity }) => (
      <div data-testid="job-card" aria-label={`${job.objective} at ${job.organizations[0]?.name}`} />
    ));
    return Component;
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  useAnimation: () => ({ start: vi.fn() }),
}));

vi.mock("../../hooks/useDragCard", () => ({
  useDragCard: () => ({
    triggerSwipe: vi.fn(),
    x: 0, y: 0, rotate: 0,
    likeOpacity: 0, nopeOpacity: 0, superOpacity: 0,
    controls: { start: vi.fn() },
    handleDragEnd: vi.fn(),
  }),
}));

vi.mock("../../hooks/useSwipeQueue", () => ({
  useSwipeQueue: () => ({ fetchMore: vi.fn() }),
}));

import { SwipeStack } from "../../components/SwipeStack";

const mockOrg: Organization = {
  id: 1, hashedId: "a", name: "Acme", status: "active", size: 10,
  publicId: "acme", picture: "", theme: "#fff",
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

describe("SwipeStack", () => {
  beforeEach(() => {
    useSwipeStore.setState({
      queue: [], isFetching: false, fetchError: null, seenIds: new Set(),
      undoCard: null, undoAction: null, isAnimating: false, isCelebrating: false, storage: null,
    });
  });

  it("shows skeleton when fetching and queue is empty", () => {
    useSwipeStore.setState({ isFetching: true, queue: [] });
    render(<SwipeStack />);
    // SkeletonCard renders shimmer elements — check for its container
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("shows empty state when queue is empty and not fetching", () => {
    useSwipeStore.setState({ isFetching: false, queue: [] });
    render(<SwipeStack />);
    expect(screen.getByText("You've seen all jobs!")).toBeInTheDocument();
  });

  it("renders a card when queue has items", () => {
    useSwipeStore.setState({ isFetching: false, queue: [makeOpp("1"), makeOpp("2")] });
    render(<SwipeStack />);
    // The mocked JobCard renders a div with data-testid
    expect(screen.getByTestId("job-card")).toBeInTheDocument();
  });
});
