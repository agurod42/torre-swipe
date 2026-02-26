import { NextRequest, NextResponse } from "next/server";
import { TorreClient, TorreApiError } from "@torre-swipe/torre-client";
import { opportunitiesSchema } from "../../../lib/validation";
import { logger } from "../../../lib/logger";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const torre = new TorreClient(
  process.env.TORRE_API_BASE_URL ?? "https://search.torre.co",
);

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  logger.info("POST /api/opportunities", { body });

  const parsed = opportunitiesSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn("Invalid request body", parsed.error.flatten());
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    const result = await torre.searchOpportunities({
      size: parsed.data.size,
      currency: parsed.data.currency,
      periodicity: parsed.data.periodicity,
      lang: "en",
      contextFeature: "job_feed",
      keywords: parsed.data.keywords,
      language: parsed.data.language,
      fluency: parsed.data.fluency,
    });
    logger.info("Torre API response", { total: result.total, count: result.results.length });
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    if (err instanceof TorreApiError) {
      logger.error("Torre API error", { status: err.status, body: err.body });
    } else {
      logger.error("Unexpected error", err);
    }
    return NextResponse.json(
      { error: "Upstream API error", message: String(err) },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
