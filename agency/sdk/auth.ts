type AgencyAuthEnvName =
  | "AGENCY_AUTH_ISSUER_URL"
  | "AGENCY_AUTH_BASE_URL"
  | "AGENCY_AUTH_AUDIENCE"
  | "AGENCY_AUTH_APP_ID"
  | "AGENCY_AUTH_EXCHANGE_URL";

export type AgencyAuthAccount = {
  accountId: string;
  id: string;
  providerId: string;
  scope: string | null;
};

export type AgencyAuthSession = {
  accounts: AgencyAuthAccount[];
  audience: string;
  expiresAt: string;
  membership: {
    firstSeenAt: string;
    id: string;
    lastSeenAt: string | null;
    lastSignInAt: string | null;
    signInCount: number;
    status: "active" | "signed_out";
  };
  user: {
    email: string;
    emailVerified: boolean;
    firstName: string | null;
    id: string;
    image: string | null;
    lastName: string | null;
    name: string;
  };
};

export type AgencyAuthExchangeResult = {
  accessToken: string;
  audience: string;
  expiresInSeconds: number;
  session: AgencyAuthSession;
  tokenType: "Bearer";
};

export const AGENCY_AUTH_COOKIE_NAME = "agency_app_session";

const getTrimmedEnv = (name: AgencyAuthEnvName) => process.env[name]?.trim() ?? "";

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/g, "");

export const getAgencyAuthConfig = () => {
  const baseUrl = getTrimmedEnv("AGENCY_AUTH_BASE_URL") || getTrimmedEnv("AGENCY_AUTH_ISSUER_URL");
  return {
    appId: getTrimmedEnv("AGENCY_AUTH_APP_ID"),
    audience: getTrimmedEnv("AGENCY_AUTH_AUDIENCE") || getTrimmedEnv("AGENCY_AUTH_APP_ID"),
    baseUrl,
    exchangeUrl: getTrimmedEnv("AGENCY_AUTH_EXCHANGE_URL"),
    issuerUrl: getTrimmedEnv("AGENCY_AUTH_ISSUER_URL"),
    sessionUrl: baseUrl ? `${withoutTrailingSlash(baseUrl)}/api/platform/auth/session` : "",
    startUrl: baseUrl ? `${withoutTrailingSlash(baseUrl)}/api/platform/auth/start` : "",
  };
};

export const hasAgencyAuthConfig = () => {
  const config = getAgencyAuthConfig();
  return Boolean(config.appId && config.exchangeUrl && config.sessionUrl && config.startUrl);
};

const getRequiredAgencyAuthConfig = () => {
  const config = getAgencyAuthConfig();
  if (!config.appId || !config.exchangeUrl || !config.sessionUrl || !config.startUrl) {
    throw new Error("Missing Agency auth runtime bindings.");
  }
  return config;
};

const readAgencyErrorMessage = async (response: Response) => {
  const text = await response.text().catch(() => "");
  if (!text) {
    return "";
  }
  try {
    const json = JSON.parse(text) as { error?: unknown };
    return typeof json.error === "string" ? json.error : text;
  } catch {
    return text;
  }
};

export const normalizeAgencyAuthReturnPath = (
  value: string | string[] | undefined,
  fallback = "/",
) => {
  const path = typeof value === "string" ? value.trim() : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
};

export const buildAgencyAuthStartUrl = (payload: { appId?: string; returnTo: string }) => {
  const config = getRequiredAgencyAuthConfig();
  const startUrl = new URL(config.startUrl);
  startUrl.searchParams.set("appId", payload.appId ?? config.appId);
  startUrl.searchParams.set("returnTo", payload.returnTo);
  return startUrl.toString();
};

export const exchangeAgencyAuthCode = async (payload: { appId?: string; code: string }) => {
  const config = getRequiredAgencyAuthConfig();
  const response = await fetch(config.exchangeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appId: payload.appId ?? config.appId,
      code: payload.code,
    }),
  });

  if (!response.ok) {
    const message = await readAgencyErrorMessage(response);
    throw new Error(message || `Agency auth exchange failed with ${response.status}`);
  }

  return (await response.json()) as AgencyAuthExchangeResult;
};

export const getAgencyAuthSession = async (accessToken: string) => {
  const config = getRequiredAgencyAuthConfig();
  const response = await fetch(config.sessionUrl, {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = await readAgencyErrorMessage(response);
    throw new Error(message || `Agency auth session lookup failed with ${response.status}`);
  }

  return (await response.json()) as AgencyAuthSession;
};

export const readAgencyAuthCookie = (cookieHeader: string | undefined) => {
  const cookies = cookieHeader?.split(";") ?? [];
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === AGENCY_AUTH_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }
  return "";
};

export const createAgencyAuthCookie = (payload: {
  accessToken: string;
  maxAgeSeconds: number;
  secure: boolean;
}) =>
  [
    `${AGENCY_AUTH_COOKIE_NAME}=${encodeURIComponent(payload.accessToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(payload.maxAgeSeconds))}`,
    payload.secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

export const clearAgencyAuthCookie = (secure: boolean) =>
  [
    `${AGENCY_AUTH_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
