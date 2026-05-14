import type { AgencyManifest } from "./types";

const DEFAULT_AGENCY_PLATFORM_BASE_URL = "https://agency.weights.com";

export type AgencyInitializableIntegration = "billing" | "analytics";

export type AgencyIntegrationInitializationResult = {
  accepted: true;
  eventId: string;
  eventType: string;
  initializedAt: string;
  reused: boolean;
};

const requireServer = () => {
  if (typeof window !== "undefined") {
    throw new Error("Agency integration initialization is server-only.");
  }
};

const requireEnv = (
  name:
    | "AGENCY_ANALYTICS_APP_ID"
    | "AGENCY_ANALYTICS_BASE_URL"
    | "AGENCY_ANALYTICS_WRITE_KEY"
    | "AGENCY_PAYMENTS_ACCESS_TOKEN"
    | "AGENCY_PAYMENTS_APP_ID"
    | "AGENCY_PAYMENTS_BASE_URL",
) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

const trimTrailingSlash = (value: string) => (value.endsWith("/") ? value.slice(0, -1) : value);

const parseInitializationResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency integration initialization failed with ${response.status}`);
  }
  return (await response.json()) as AgencyIntegrationInitializationResult;
};

const trimEnv = (
  name:
    | "AGENCY_BASE_URL"
    | "AGENCY_AUTH_BASE_URL"
    | "AGENCY_AUTH_ISSUER_URL"
    | "AGENCY_AUTH_APP_ID"
    | "AGENCY_ANALYTICS_APP_ID"
    | "AGENCY_PAYMENTS_APP_ID",
) => process.env[name]?.trim() ?? "";

const getAgencyPlatformBaseUrl = () => {
  const value =
    trimEnv("AGENCY_BASE_URL") ||
    trimEnv("AGENCY_AUTH_BASE_URL") ||
    trimEnv("AGENCY_AUTH_ISSUER_URL") ||
    DEFAULT_AGENCY_PLATFORM_BASE_URL;
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const resolveAppId = (appId?: string) =>
  appId?.trim() || trimEnv("AGENCY_AUTH_APP_ID") || trimEnv("AGENCY_ANALYTICS_APP_ID") || trimEnv("AGENCY_PAYMENTS_APP_ID");

export const getAgencyPlatformConfig = (appId?: string) => ({
  baseUrl: getAgencyPlatformBaseUrl(),
  appId: resolveAppId(appId),
});

export const getAgencyPlatformManifest = async (appId?: string) => {
  const config = getAgencyPlatformConfig(appId);
  if (!config.appId) {
    throw new Error("Missing Agency app id");
  }

  const response = await fetch(`${config.baseUrl}/api/platform/manifest/${encodeURIComponent(config.appId)}`);
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency manifest request failed with ${response.status}`);
  }

  return (await response.json()) as AgencyManifest;
};

export const listAgencyPlatformEvents = async (appId?: string) => {
  const config = getAgencyPlatformConfig(appId);
  if (!config.appId) {
    throw new Error("Missing Agency app id");
  }

  const response = await fetch(`${config.baseUrl}/api/platform/events?appId=${encodeURIComponent(config.appId)}`);
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency events request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
};

export const initializeAgencyIntegration = async (integration: AgencyInitializableIntegration) => {
  requireServer();

  if (integration === "billing") {
    return await parseInitializationResponse(
      await fetch(`${trimTrailingSlash(requireEnv("AGENCY_PAYMENTS_BASE_URL"))}/initialize`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${requireEnv("AGENCY_PAYMENTS_ACCESS_TOKEN")}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
        }),
      }),
    );
  }

  return await parseInitializationResponse(
    await fetch(`${trimTrailingSlash(requireEnv("AGENCY_ANALYTICS_BASE_URL"))}/initialize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        appId: requireEnv("AGENCY_ANALYTICS_APP_ID"),
        writeKey: requireEnv("AGENCY_ANALYTICS_WRITE_KEY"),
      }),
    }),
  );
};
