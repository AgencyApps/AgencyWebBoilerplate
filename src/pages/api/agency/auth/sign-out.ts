import type { NextApiRequest, NextApiResponse } from "next";
import { clearAgencyAuthCookie } from "agency/sdk/auth";

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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Set-Cookie", clearAgencyAuthCookie(getRequestProtocol(req) === "https"));
  return res.status(200).json({ ok: true });
}
