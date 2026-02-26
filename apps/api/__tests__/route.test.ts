import { vi, describe, it, expect, beforeEach } from "vitest";
import { TorreApiError } from "@torre-swipe/torre-client";

// Mock the torre-client module before importing the route
vi.mock("@torre-swipe/torre-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@torre-swipe/torre-client")>();
  return {
    ...actual,
    TorreClient: vi.fn().mockImplementation(() => ({
      searchOpportunities: vi.fn(),
    })),
  };
});

// We need to import after the mock is set up
const { TorreClient } = await import("@torre-swipe/torre-client");

// Helper to build a mock NextRequest
function mockRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== null ? JSON.stringify(body) : undefined,
  });
}

function mockBrokenRequest(): Request {
  return new Request("http://localhost:3001/api/opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{{{",
  });
}

const mockResults = [
  {
    id: "opp-1",
    objective: "Engineer",
    slug: "engineer",
    tagline: "Build stuff",
    theme: "#000",
    type: "full-time-employment",
    opportunity: "employee",
    organizations: [],
    locations: [],
    timezones: null,
    remote: true,
    external: false,
    deadline: null,
    created: "2024-01-01T00:00:00Z",
    status: "open",
    commitment: "full-time",
    externalApplicationUrl: null,
    compensation: {
      data: {
        code: "range",
        currency: "USD",
        minAmount: 100000,
        minHourlyUSD: 48,
        maxAmount: 150000,
        maxHourlyUSD: 72,
        periodicity: "yearly",
        negotiable: false,
        conversionRateUSD: 1,
      },
      visible: true,
      additionalCompensationDetails: {},
    },
    skills: [],
    place: {
      remote: true,
      anywhere: true,
      timezone: false,
      locationType: "anywhere",
      location: [],
    },
  },
];

describe("POST /api/opportunities", () => {
  let mockSearchOpportunities: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearchOpportunities = vi.fn();
    (TorreClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      searchOpportunities: mockSearchOpportunities,
    }));

    // Re-import route fresh to pick up the new mock
    vi.resetModules();
  });

  it("returns 200 with results on valid body", async () => {
    mockSearchOpportunities.mockResolvedValueOnce({
      total: 1,
      size: 1,
      results: mockResults,
    });

    // Dynamically import after mock reset
    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({ size: 5, currency: "USD" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const data = await res.json() as { total: number; results: unknown[] };
    expect(data.total).toBe(1);
    expect(data.results).toHaveLength(1);
  });

  it("returns 400 on invalid body (size too large)", async () => {
    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({ size: 999 });
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 on unparseable JSON body", async () => {
    const { POST } = await import("../app/api/opportunities/route");
    const req = mockBrokenRequest();
    const res = await POST(req as never);

    expect(res.status).toBe(400);
  });

  it("returns 400 on null body", async () => {
    const { POST } = await import("../app/api/opportunities/route");
    const req = new Request("http://localhost:3001/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });
    const res = await POST(req as never);
    // null body is valid JSON but fails schema (not an object)
    expect(res.status).toBe(400);
  });

  it("returns 502 when Torre client throws TorreApiError", async () => {
    mockSearchOpportunities.mockRejectedValueOnce(new TorreApiError(503, "Unavailable"));

    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({ size: 5 });
    const res = await POST(req as never);

    expect(res.status).toBe(502);
    const data = await res.json() as { error: string };
    expect(data.error).toBe("Upstream API error");
  });

  it("returns 502 when Torre client throws a generic error", async () => {
    mockSearchOpportunities.mockRejectedValueOnce(new Error("Network timeout"));

    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({});
    const res = await POST(req as never);

    expect(res.status).toBe(502);
  });

  it("includes CORS headers in 200 response", async () => {
    mockSearchOpportunities.mockResolvedValueOnce({ total: 0, size: 0, results: [] });

    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({});
    const res = await POST(req as never);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("includes CORS headers in 400 response", async () => {
    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({ size: -1 });
    const res = await POST(req as never);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("includes CORS headers in 502 response", async () => {
    mockSearchOpportunities.mockRejectedValueOnce(new Error("fail"));

    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({});
    const res = await POST(req as never);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns 204 for OPTIONS preflight", async () => {
    const { OPTIONS } = await import("../app/api/opportunities/route");
    const res = await OPTIONS();

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("handles empty results gracefully", async () => {
    mockSearchOpportunities.mockResolvedValueOnce({ total: 0, size: 0, results: [] });

    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({});
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const data = await res.json() as { results: unknown[] };
    expect(data.results).toHaveLength(0);
  });

  it("uses default size of 10 when not provided", async () => {
    mockSearchOpportunities.mockResolvedValueOnce({ total: 0, size: 0, results: [] });

    const { POST } = await import("../app/api/opportunities/route");
    const req = mockRequest({});
    await POST(req as never);

    expect(mockSearchOpportunities).toHaveBeenCalledWith(
      expect.objectContaining({ size: 10 }),
    );
  });
});
