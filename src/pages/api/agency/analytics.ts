import type { NextApiRequest, NextApiResponse } from "next";
import {
  agencyAnalyticsEventInputSchema,
  hasAgencyAnalyticsConfig,
  trackAgencyServerEvent,
  type AgencyAnalyticsCaptureResult,
} from "agency/sdk/analytics";

export default async function handler(req: NextApiRequest, res: NextApiResponse<AgencyAnalyticsCaptureResult | { error: string }>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasAgencyAnalyticsConfig()) {
    return res.status(202).json({
      accepted: false,
      reason: "analytics_not_configured",
    });
  }

  try {
    const input = agencyAnalyticsEventInputSchema.parse(req.body);
    return res.status(200).json(await trackAgencyServerEvent(input));
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid analytics event",
    });
  }
}
