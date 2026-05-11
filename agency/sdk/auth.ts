const getTrimmedEnv = (name: "AGENCY_AUTH_ISSUER_URL" | "AGENCY_AUTH_BASE_URL" | "AGENCY_AUTH_AUDIENCE" | "AGENCY_AUTH_APP_ID" | "AGENCY_AUTH_EXCHANGE_URL") =>
  process.env[name]?.trim() ?? "";

export const getAgencyAuthConfig = () => ({
  issuerUrl: getTrimmedEnv("AGENCY_AUTH_ISSUER_URL"),
  baseUrl: getTrimmedEnv("AGENCY_AUTH_BASE_URL") || getTrimmedEnv("AGENCY_AUTH_ISSUER_URL"),
  audience: getTrimmedEnv("AGENCY_AUTH_AUDIENCE") || getTrimmedEnv("AGENCY_AUTH_APP_ID"),
  appId: getTrimmedEnv("AGENCY_AUTH_APP_ID"),
  exchangeUrl: getTrimmedEnv("AGENCY_AUTH_EXCHANGE_URL"),
});

export const hasAgencyAuthConfig = () => {
  const config = getAgencyAuthConfig();
  return Boolean(config.baseUrl && config.appId && config.exchangeUrl);
};

export const exchangeAgencyAuthToken = async (payload: { sessionToken: string; userId: string; appId?: string }) => {
  const config = getAgencyAuthConfig();
  if (!config.exchangeUrl) {
    throw new Error("Missing AGENCY_AUTH_EXCHANGE_URL");
  }

  const response = await fetch(config.exchangeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appId: payload.appId ?? config.appId,
      userId: payload.userId,
      sessionToken: payload.sessionToken,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency auth exchange failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
};
