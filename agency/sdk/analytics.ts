import { z } from "zod";

const requireServer = () => {
  if (typeof window !== "undefined") {
    throw new Error("Agency analytics server helpers are server-only.");
  }
};

const requireEnv = (name: "AGENCY_ANALYTICS_BASE_URL" | "AGENCY_ANALYTICS_APP_ID" | "AGENCY_ANALYTICS_WRITE_KEY") => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

let browserProxyState: "unknown" | "enabled" | "disabled" = "unknown";

export const agencyAnalyticsEventInputSchema = z.object({
  name: z.string().trim().min(1),
  userId: z.string().trim().min(1).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

export type AgencyAnalyticsEventInput = z.infer<typeof agencyAnalyticsEventInputSchema>;

export type AgencyAnalyticsAcceptedResult = {
  accepted: true;
  eventId: string;
  normalizedEventName: string;
};

export type AgencyAnalyticsSkippedResult = {
  accepted: false;
  reason: "analytics_not_configured";
};

export type AgencyAnalyticsCaptureResult = AgencyAnalyticsAcceptedResult | AgencyAnalyticsSkippedResult;

const getBaseUrl = () => {
  const value = requireEnv("AGENCY_ANALYTICS_BASE_URL");
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const parseCaptureResult = async (response: Response) => {
  return (await response.json()) as AgencyAnalyticsCaptureResult;
};

export const getAgencyAnalyticsConfig = () => ({
  baseUrl: getBaseUrl(),
  appId: requireEnv("AGENCY_ANALYTICS_APP_ID"),
  writeKey: requireEnv("AGENCY_ANALYTICS_WRITE_KEY"),
});

export const hasAgencyAnalyticsConfig = () =>
  Boolean(
    process.env.AGENCY_ANALYTICS_BASE_URL?.trim() &&
      process.env.AGENCY_ANALYTICS_APP_ID?.trim() &&
      process.env.AGENCY_ANALYTICS_WRITE_KEY?.trim(),
  );

export const trackAgencyEvent = async (input: AgencyAnalyticsEventInput) => {
  requireServer();
  const event = agencyAnalyticsEventInputSchema.parse(input);
  const config = getAgencyAnalyticsConfig();
  const response = await fetch(`${config.baseUrl}/trackEvent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appId: config.appId,
      writeKey: config.writeKey,
      ...event,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency analytics request failed with ${response.status}`);
  }

  return (await response.json()) as AgencyAnalyticsAcceptedResult;
};

export const trackAgencyServerEvent = trackAgencyEvent;

export const trackAgencyBrowserEvent = async (
  input: AgencyAnalyticsEventInput,
  options: { endpoint?: string } = {},
) => {
  if (typeof window === "undefined") {
    throw new Error("Agency browser analytics can only run in the browser.");
  }

  if (browserProxyState === "disabled") {
    return {
      accepted: false,
      reason: "analytics_not_configured",
    } satisfies AgencyAnalyticsSkippedResult;
  }

  const response = await fetch(options.endpoint ?? "/api/agency/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(agencyAnalyticsEventInputSchema.parse(input)),
    keepalive: true,
  });

  if (response.status === 202) {
    browserProxyState = "disabled";
    return await parseCaptureResult(response);
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency analytics proxy failed with ${response.status}`);
  }

  browserProxyState = "enabled";
  return await parseCaptureResult(response);
};
