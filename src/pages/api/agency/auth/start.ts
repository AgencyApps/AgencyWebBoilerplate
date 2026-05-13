import type { NextApiRequest, NextApiResponse } from "next";
import {
  buildAgencyAuthStartUrl,
  hasAgencyAuthConfig,
  normalizeAgencyAuthReturnPath,
} from "agency/sdk/auth";

const getFirstHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getConfiguredOrigin = () => {
  for (const value of [
    process.env.APP_PUBLIC_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BASE_URL,
  ]) {
    if (!value?.trim()) {
      continue;
    }
    try {
      return new URL(value).origin;
    } catch {
      // Try the next configured value.
    }
  }
  return "";
};

const getRequestOrigin = (req: NextApiRequest) => {
  const configuredOrigin = getConfiguredOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const host =
    getFirstHeaderValue(req.headers["x-forwarded-host"]) ?? req.headers.host ?? "localhost:3000";
  const protocol =
    getFirstHeaderValue(req.headers["x-forwarded-proto"])?.split(",")[0]?.trim() || "http";
  return `${protocol}://${host}`;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!hasAgencyAuthConfig()) {
    res.status(503).json({ error: "Agency auth is not configured for this app." });
    return;
  }

  const next = normalizeAgencyAuthReturnPath(req.query.next);
  const callbackUrl = new URL(
    `/api/agency/auth/callback?next=${encodeURIComponent(next)}`,
    getRequestOrigin(req),
  );
  res.redirect(307, buildAgencyAuthStartUrl({ returnTo: callbackUrl.toString() }));
}
