const requireServer = () => {
  if (typeof window !== "undefined") {
    throw new Error("Agency storage SDK helpers are server-only.");
  }
};

const requireEnv = (
  name: "AGENCY_STORAGE_BASE_URL" | "AGENCY_STORAGE_APP_ID" | "AGENCY_STORAGE_PUBLIC_BASE_URL" | "AGENCY_STORAGE_ACCESS_TOKEN",
) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

const getBaseUrl = () => {
  const value = requireEnv("AGENCY_STORAGE_BASE_URL");
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const buildStorageHeaders = () => ({
  authorization: `Bearer ${requireEnv("AGENCY_STORAGE_ACCESS_TOKEN")}`,
  "content-type": "application/json",
});

const storageFetch = async <T>(path: string, body: Record<string, unknown>) => {
  requireServer();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: buildStorageHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency storage request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

export type AgencyStorageUploadInput = {
  fileName: string;
  contentType?: string;
};

export type AgencyStorageUploadTicket = {
  key: string;
  publicUrl: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  expiresAt: string;
};

export type AgencyStorageDeleteInput = {
  key: string;
};

export type AgencyStorageDeleteResult = {
  deleted: true;
  key: string;
};

export const getAgencyStorageConfig = () => ({
  baseUrl: getBaseUrl(),
  appId: requireEnv("AGENCY_STORAGE_APP_ID"),
  publicBaseUrl: requireEnv("AGENCY_STORAGE_PUBLIC_BASE_URL"),
});

export const createAgencyStorageUpload = async (input: AgencyStorageUploadInput) => {
  const config = getAgencyStorageConfig();
  return await storageFetch<AgencyStorageUploadTicket>("/uploads", {
    appId: config.appId,
    ...input,
  });
};

export const deleteAgencyStorageObject = async (input: AgencyStorageDeleteInput) => {
  const config = getAgencyStorageConfig();
  return await storageFetch<AgencyStorageDeleteResult>("/objects/delete", {
    appId: config.appId,
    ...input,
  });
};
