import type { AgencyManifest } from "./types";

const DEFAULT_AGENCY_PLATFORM_BASE_URL = "https://agency.weights.com";

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
