import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Opportunity } from "@torre-swipe/types";

vi.mock("../../components/SwipeStack", () => ({
  SwipeStack: () => <div data-testid="swipe-stack" />,
}));

vi.mock("../../components/ActionBar", () => ({
  ActionBar: () => <div data-testid="action-bar" />,
}));

vi.mock("../../components/CelebrationOverlay", () => ({
  CelebrationOverlay: () => <div data-testid="celebration-overlay" />,
}));

vi.mock("../../hooks/useDragCard", () => ({
  useDragCard: () => ({
    triggerSwipe: vi.fn(),
  }),
}));

vi.mock("../../store/swipeStore", async () => {
  const actual = await vi.importActual<typeof import("../../store/swipeStore")>(
    "../../store/swipeStore",
  );
  return {
    ...actual,
    initSwipeStore: vi.fn(),
  };
});

import HomePage from "../../app/page";
import { useSwipeStore } from "../../store/swipeStore";

const mockOpportunity = { id: "1" } as unknown as Opportunity;

describe("HomePage", () => {
  beforeEach(() => {
    useSwipeStore.setState({
      queue: [],
      seenIds: new Set(),
      isFetching: false,
      fetchError: null,
      undoCard: null,
      undoAction: null,
      isAnimating: false,
      isCelebrating: false,
      storage: null,
    });
  });

  it("does not render ActionBar when queue is empty", () => {
    render(<HomePage />);
    expect(screen.queryByTestId("action-bar")).not.toBeInTheDocument();
  });

  it("renders ActionBar when queue has cards", () => {
    useSwipeStore.setState({ queue: [mockOpportunity] });
    render(<HomePage />);
    expect(screen.getByTestId("action-bar")).toBeInTheDocument();
  });
});
