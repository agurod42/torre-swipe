import { describe, it, expect, vi, afterEach } from "vitest";
import { openExternalApplication } from "../../lib/externalApplication";

describe("openExternalApplication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens external application URL in a new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    openExternalApplication("https://example.com/apply");

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/apply",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("does not open a tab when URL is missing", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    openExternalApplication(null);

    expect(openSpy).not.toHaveBeenCalled();
  });
});
