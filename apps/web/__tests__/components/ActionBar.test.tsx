import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionBar } from "../../components/ActionBar";
import { useSwipeStore } from "../../store/swipeStore";

// Mock useDragCard
const mockTriggerSwipe = vi.fn();
vi.mock("../../hooks/useDragCard", () => ({
  useDragCard: () => ({
    triggerSwipe: mockTriggerSwipe,
    x: { get: () => 0 },
    y: { get: () => 0 },
    rotate: { get: () => 0 },
    likeOpacity: { get: () => 0 },
    nopeOpacity: { get: () => 0 },
    superOpacity: { get: () => 0 },
    controls: {},
    handleDragEnd: vi.fn(),
  }),
}));

describe("ActionBar", () => {
  beforeEach(() => {
    useSwipeStore.setState({ isAnimating: false });
    vi.clearAllMocks();
  });

  it("renders all 3 buttons", () => {
    render(<ActionBar />);
    expect(screen.getByRole("button", { name: "Pass this job" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like this job" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Super like this job" })).toBeInTheDocument();
  });

  it("calls triggerSwipe('left') on pass button click", () => {
    render(<ActionBar />);
    fireEvent.click(screen.getByRole("button", { name: "Pass this job" }));
    expect(mockTriggerSwipe).toHaveBeenCalledWith("left");
  });

  it("calls triggerSwipe('right') on like button click", () => {
    render(<ActionBar />);
    fireEvent.click(screen.getByRole("button", { name: "Like this job" }));
    expect(mockTriggerSwipe).toHaveBeenCalledWith("right");
  });

  it("calls triggerSwipe('up') on super button click", () => {
    render(<ActionBar />);
    fireEvent.click(screen.getByRole("button", { name: "Super like this job" }));
    expect(mockTriggerSwipe).toHaveBeenCalledWith("up");
  });

  it("buttons are disabled when isAnimating is true", () => {
    useSwipeStore.setState({ isAnimating: true });
    render(<ActionBar />);
    expect(screen.getByRole("button", { name: "Pass this job" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Like this job" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Super like this job" })).toBeDisabled();
  });

  it("does not call triggerSwipe when isAnimating", () => {
    useSwipeStore.setState({ isAnimating: true });
    render(<ActionBar />);
    // Buttons are disabled, clicks should not fire
    fireEvent.click(screen.getByRole("button", { name: "Like this job" }));
    expect(mockTriggerSwipe).not.toHaveBeenCalled();
  });
});
