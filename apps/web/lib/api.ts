import type { SearchResponse } from "@torre-swipe/types";
import { logger } from "./logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type FetchOpportunitiesParams = {
  size?: number;
  keywords?: string;
  currency?: string;
  periodicity?: string;
};

export async function fetchOpportunities(
  params: FetchOpportunitiesParams = {},
): Promise<SearchResponse> {
  logger.info("fetchOpportunities", params);

  const res = await fetch(`${API_URL}/api/opportunities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ size: 10, currency: "USD", periodicity: "yearly", ...params }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error("fetchOpportunities error", { status: res.status, body: text });
    throw new Error(`BFF error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as SearchResponse;
  logger.info("fetchOpportunities result", { total: data.total, count: data.results.length });
  return data;
}
