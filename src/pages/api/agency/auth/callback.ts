import type { NextApiRequest, NextApiResponse } from "next";
import {
  createAgencyAuthCookie,
  exchangeAgencyAuthCode,
  normalizeAgencyAuthReturnPath,
} from "agency/sdk/auth";

const getFirstHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getRequestProtocol = (req: NextApiRequest) => {
  const forwardedProtocol = getFirstHeaderValue(req.headers["x-forwarded-proto"])
    ?.split(",")[0]
    ?.trim();
  if (forwardedProtocol) {
    return forwardedProtocol;
  }
  return (process.env.APP_PUBLIC_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "")
    .trim()
    .startsWith("https:")
    ? "https"
    : "http";
};

const redirectWithError = (res: NextApiResponse, next: string, error: string) => {
  const redirectUrl = new URL(next, "http://agency-app.local");
  redirectUrl.searchParams.set("agencyAuthError", error);
  res.redirect(303, `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const next = normalizeAgencyAuthReturnPath(req.query.next);
  const code = typeof req.query.agency_code === "string" ? req.query.agency_code.trim() : "";
  if (!code) {
    redirectWithError(res, next, "missing_code");
    return;
  }

  try {
    const exchange = await exchangeAgencyAuthCode({ code });
    res.setHeader(
      "Set-Cookie",
      createAgencyAuthCookie({
        accessToken: exchange.accessToken,
        maxAgeSeconds: exchange.expiresInSeconds,
        secure: getRequestProtocol(req) === "https",
      }),
    );
    res.redirect(303, next);
  } catch (error) {
    redirectWithError(res, next, error instanceof Error ? error.message : "exchange_failed");
  }
}
