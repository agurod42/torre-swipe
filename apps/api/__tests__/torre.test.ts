import { vi, describe, it, expect, beforeEach } from "vitest";
import { TorreClient, TorreApiError } from "@torre-swipe/torre-client";
import type { Opportunity, Organization, Compensation, Skill, Place } from "@torre-swipe/types";

vi.stubGlobal("fetch", vi.fn());

const mockFetch = fetch as ReturnType<typeof vi.fn>;

const mockOrg: Organization = {
  id: 1,
  hashedId: "abc",
  name: "Acme Corp",
  status: "active",
  size: 50,
  publicId: "acme",
  picture: "https://example.com/logo.png",
  theme: "#fff",
};

const mockCompensation: Compensation = {
  data: {
    code: "range",
    currency: "USD",
    minAmount: 120000,
    minHourlyUSD: 57.69,
    maxAmount: 160000,
    maxHourlyUSD: 76.92,
    periodicity: "yearly",
    negotiable: false,
    conversionRateUSD: 1,
  },
  visible: true,
  additionalCompensationDetails: {},
};

const mockSkill: Skill = {
  name: "React",
  experience: "applying",
  proficiency: "proficient",
};

const mockPlace: Place = {
  remote: true,
  anywhere: true,
  timezone: false,
  locationType: "anywhere",
  location: [],
};

const mockOpportunity: Opportunity = {
  id: "opp-1",
  objective: "Senior Engineer",
  slug: "senior-engineer",
  tagline: "Build amazing things",
  theme: "#000",
  type: "full-time-employment",
  opportunity: "employee",
  organizations: [mockOrg],
  locations: ["United States"],
  timezones: null,
  remote: true,
  external: false,
  deadline: null,
  created: "2024-01-01T00:00:00Z",
  status: "open",
  commitment: "full-time",
  externalApplicationUrl: "https://example.com/apply",
  compensation: mockCompensation,
  skills: [mockSkill],
  place: mockPlace,
};

describe("TorreClient", () => {
  let client: TorreClient;

  beforeEach(() => {
    client = new TorreClient("https://search.torre.co");
    vi.clearAllMocks();
  });

  describe("searchOpportunities", () => {
    it("returns parsed results on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 1, size: 1, results: [mockOpportunity] }),
      });

      const result = await client.searchOpportunities({ size: 1 });

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.results[0].id).toBe("opp-1");
    });

    it("constructs correct URL query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, size: 0, results: [] }),
      });

      await client.searchOpportunities({
        size: 10,
        currency: "USD",
        periodicity: "yearly",
        lang: "en",
        contextFeature: "job_feed",
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("currency=USD");
      expect(url).toContain("periodicity=yearly");
      expect(url).toContain("lang=en");
      expect(url).toContain("size=10");
      expect(url).toContain("contextFeature=job_feed");
    });

    it("always includes status:open in request body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, size: 0, results: [] }),
      });

      await client.searchOpportunities({});

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { and: unknown[] };
      expect(body.and).toContainEqual({ status: { code: "open" } });
    });

    it("adds keywords filter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, size: 0, results: [] }),
      });

      await client.searchOpportunities({ keywords: "React", lang: "en" });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { and: unknown[] };
      expect(body.and).toContainEqual({
        keywords: { term: "React", locale: "en" },
      });
    });

    it("adds language filter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, size: 0, results: [] }),
      });

      await client.searchOpportunities({ language: "English", fluency: "fully-fluent" });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { and: unknown[] };
      expect(body.and).toContainEqual({
        language: { term: "English", fluency: "fully-fluent" },
      });
    });

    it("throws TorreApiError on non-200 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      await expect(client.searchOpportunities({})).rejects.toBeInstanceOf(TorreApiError);
    });

    it("TorreApiError carries status and body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal error",
      });

      try {
        await client.searchOpportunities({});
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(TorreApiError);
        const apiErr = err as TorreApiError;
        expect(apiErr.status).toBe(500);
        expect(apiErr.body).toBe("Internal error");
        expect(apiErr.message).toContain("500");
      }
    });

    it("throws on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(client.searchOpportunities({})).rejects.toThrow("Network error");
    });

    it("handles response with compensation.visible = false", async () => {
      const oppWithHiddenSalary = {
        ...mockOpportunity,
        compensation: { ...mockCompensation, visible: false },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 1, size: 1, results: [oppWithHiddenSalary] }),
      });

      const result = await client.searchOpportunities({});
      expect(result.results[0].compensation.visible).toBe(false);
    });

    it("handles empty results array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, size: 0, results: [] }),
      });

      const result = await client.searchOpportunities({});
      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("omits undefined query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, size: 0, results: [] }),
      });

      await client.searchOpportunities({});

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).not.toContain("currency=");
      expect(url).not.toContain("periodicity=");
    });
  });
});
