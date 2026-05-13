import type { NextApiRequest, NextApiResponse } from "next";
import {
  clearAgencyAuthCookie,
  getAgencyAuthSession,
  readAgencyAuthCookie,
  type AgencyAuthSession,
} from "agency/sdk/auth";

type AgencyAuthSessionResponse = {
  authenticated: boolean;
  error?: string;
  session: AgencyAuthSession | null;
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AgencyAuthSessionResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accessToken = readAgencyAuthCookie(req.headers.cookie);
  if (!accessToken) {
    return res.status(200).json({ authenticated: false, session: null });
  }

  try {
    const session = await getAgencyAuthSession(accessToken);
    return res.status(200).json({ authenticated: true, session });
  } catch (error) {
    res.setHeader("Set-Cookie", clearAgencyAuthCookie(getRequestProtocol(req) === "https"));
    return res.status(200).json({
      authenticated: false,
      error: error instanceof Error ? error.message : "Agency app session expired.",
      session: null,
    });
  }
}
