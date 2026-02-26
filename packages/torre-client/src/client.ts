import type { SearchResponse } from "@torre-swipe/types";

export class TorreApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Torre API error ${status}: ${body}`);
    this.name = "TorreApiError";
  }
}

export type SearchParams = {
  size?: number;
  currency?: string;
  periodicity?: string;
  lang?: string;
  contextFeature?: string;
  keywords?: string;
  language?: string;
  fluency?: string;
};

export class TorreClient {
  constructor(private readonly baseUrl: string) {}

  async searchOpportunities(params: SearchParams): Promise<SearchResponse> {
    const qs = new URLSearchParams();
    if (params.currency) qs.set("currency", params.currency);
    if (params.periodicity) qs.set("periodicity", params.periodicity);
    if (params.lang) qs.set("lang", params.lang);
    if (params.size != null) qs.set("size", String(params.size));
    if (params.contextFeature) qs.set("contextFeature", params.contextFeature);

    const andFilters: unknown[] = [{ status: { code: "open" } }];

    if (params.keywords) {
      andFilters.push({ keywords: { term: params.keywords, locale: params.lang ?? "en" } });
    }
    if (params.language) {
      andFilters.push({
        language: { term: params.language, fluency: params.fluency ?? "fully-fluent" },
      });
    }

    const url = `${this.baseUrl}/opportunities/_search?${qs.toString()}`;
    const body = JSON.stringify({ and: andFilters });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch (err) {
      throw new Error(`Network error reaching Torre API: ${String(err)}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new TorreApiError(response.status, text);
    }

    return response.json() as Promise<SearchResponse>;
  }
}
