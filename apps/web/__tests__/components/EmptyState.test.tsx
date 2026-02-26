import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyState } from "../../components/EmptyState";

describe("EmptyState", () => {
  it("renders the empty state heading", () => {
    render(<EmptyState onRefresh={vi.fn()} />);
    expect(screen.getByText("You've seen all jobs!")).toBeInTheDocument();
  });

  it("renders the refresh button", () => {
    render(<EmptyState onRefresh={vi.fn()} />);
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(<EmptyState onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("renders disabled action buttons in footer", () => {
    render(<EmptyState onRefresh={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Pass this job" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Like this job" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Super like this job" })).toBeDisabled();
  });
});
