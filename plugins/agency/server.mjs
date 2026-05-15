#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";

const DEFAULT_AGENCY_BASE_URL = process.env.AGENCY_DEVELOPER_BASE_URL?.trim() || "https://agency.weights.com";
const CLIENT_ID = "agency-codex-plugin";
const OOB_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";
const DEVELOPER_SCOPE = "agency.developer.full_access";
const AUTH_DIR = join(homedir(), ".agency-codex");
const AUTH_PATH = join(AUTH_DIR, "oauth.json");
const PENDING_AUTH_PATH = join(AUTH_DIR, "oauth-pending.json");
const ENV_BEGIN = "# BEGIN AGENCY MANAGED ENV";
const ENV_END = "# END AGENCY MANAGED ENV";

const compact = (value) => JSON.parse(JSON.stringify(value));
const textResult = (value) => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(compact(value), null, 2) }],
});
const errorResult = (message) => ({
  content: [{ type: "text", text: message }],
  isError: true,
});
const objectSchema = (properties, required = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const stringProp = (description) => ({ type: "string", description });
const booleanProp = (description) => ({ type: "boolean", description });
const jsonProp = (description) => ({ type: "object", description, additionalProperties: true });
const companySchema = { companyId: stringProp("Agency company id.") };

const tools = [
  {
    name: "agency_oauth_start",
    description: "Start the Agency OAuth PKCE flow and return the authorization URL to open in a browser.",
    inputSchema: objectSchema({
      agencyBaseUrl: stringProp("Optional Agency base URL. Defaults to production."),
    }),
  },
  {
    name: "agency_oauth_finish",
    description: "Finish Agency OAuth after authorization by exchanging the one-time code shown by Agency.",
    inputSchema: objectSchema({
      code: stringProp("One-time Agency OAuth authorization code."),
    }, ["code"]),
  },
  {
    name: "agency_list_companies",
    description: "List companies available to the connected Agency developer account.",
    inputSchema: objectSchema({}),
  },
  {
    name: "agency_match_company_repository",
    description: "Match the current git remotes or a repository full name to Agency companies.",
    inputSchema: objectSchema({
      remoteUrls: { type: "array", items: { type: "string" }, description: "Git remote URLs from the local repo." },
      repositoryFullName: stringProp("Optional owner/name repository identifier."),
    }),
  },
  {
    name: "agency_discover_capabilities",
    description: "Read a high-signal Agency capability snapshot before deciding what implementation or account action to take.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_sync_local_env",
    description: "Fetch Agency-managed bindings and merge them into a managed section of the target repo's .env.local.",
    inputSchema: objectSchema({
      ...companySchema,
      projectDir: stringProp("Absolute path to the app repository whose .env.local should be updated."),
      provisionDatabase: booleanProp("Provision the hosted Agency Postgres database if it is not ready yet."),
    }, ["companyId", "projectDir"]),
  },
  {
    name: "agency_issue_push_access",
    description: "Issue an authenticated short-lived Agency push URL for the company repository.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_get_deploy_state",
    description: "Read current deployment details and status for an Agency company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_trigger_deploy",
    description: "Trigger an explicit manual Agency deploy or retry for a company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_get_integrations",
    description: "Read platform and product integration readiness for a company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_set_integration_state",
    description: "Enable or update a platform integration state such as email, banking, leads, or analytics.",
    inputSchema: objectSchema({
      ...companySchema,
      key: { type: "string", enum: ["email", "banking", "leads", "analytics"] },
      enabled: booleanProp("Whether the integration is enabled."),
      configured: booleanProp("Whether the integration is configured."),
    }, ["companyId", "key"]),
  },
  {
    name: "agency_get_email_state",
    description: "Read company mailbox setup/readiness state.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_start_email_setup",
    description: "Start Agency mailbox setup for the selected company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_get_event_catalog",
    description: "List triggerable Agency event types available for routines.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_list_agents",
    description: "List installed and available Agency agents for a company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_create_custom_agent",
    description: "Create a custom Agency add-on agent.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("createCustomAddOnAgent input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_install_managed_agent",
    description: "Install a managed Agency add-on agent by slug.",
    inputSchema: objectSchema({ ...companySchema, slug: stringProp("Managed add-on agent slug.") }, ["companyId", "slug"]),
  },
  {
    name: "agency_update_custom_agent",
    description: "Update an existing custom Agency add-on agent.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("updateCustomAddOnAgent input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_rebuild_agent",
    description: "Rebuild an Agency add-on agent runtime.",
    inputSchema: objectSchema({ ...companySchema, agentId: stringProp("Agent id.") }, ["companyId", "agentId"]),
  },
  {
    name: "agency_remove_agent",
    description: "Remove an Agency add-on agent.",
    inputSchema: objectSchema({ ...companySchema, agentId: stringProp("Agent id.") }, ["companyId", "agentId"]),
  },
  {
    name: "agency_list_routines",
    description: "List Agency routines for a company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_get_routine",
    description: "Read one Agency routine and its triggers.",
    inputSchema: objectSchema({ ...companySchema, lifecycleId: stringProp("Routine id.") }, ["companyId", "lifecycleId"]),
  },
  {
    name: "agency_create_routine",
    description: "Create an Agency routine.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("createAgentLifecycle input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_create_routine_with_trigger",
    description: "Create an Agency routine plus its initial recurring or event trigger.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("createAgentLifecycleWithTrigger input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_update_routine",
    description: "Update an Agency routine.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("updateAgentLifecycle input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_remove_routine",
    description: "Remove an Agency routine.",
    inputSchema: objectSchema({ ...companySchema, lifecycleId: stringProp("Routine id.") }, ["companyId", "lifecycleId"]),
  },
  {
    name: "agency_create_routine_trigger",
    description: "Create an event or recurring trigger on an existing Agency routine.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("createAgentLifecycleTrigger input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_update_routine_trigger",
    description: "Update an existing Agency routine trigger.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("updateAgentLifecycleTrigger input payload.") }, ["companyId", "input"]),
  },
  {
    name: "agency_remove_routine_trigger",
    description: "Remove an Agency routine trigger.",
    inputSchema: objectSchema({ ...companySchema, triggerId: stringProp("Trigger id.") }, ["companyId", "triggerId"]),
  },
  {
    name: "agency_list_routine_templates",
    description: "List Agency starter routines and readiness blockers.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_install_routine_template",
    description: "Install a starter routine template such as new-signup-follow-up.",
    inputSchema: objectSchema({ ...companySchema, templateKey: stringProp("Starter routine template key.") }, ["companyId", "templateKey"]),
  },
  {
    name: "agency_get_payment_catalog",
    description: "Read the Agency Payments catalog for the company.",
    inputSchema: objectSchema(companySchema, ["companyId"]),
  },
  {
    name: "agency_upsert_payment_product",
    description: "Create or reconcile a stable Agency Payments catalog product.",
    inputSchema: objectSchema({ ...companySchema, input: jsonProp("Payment product upsert input, excluding appId.") }, ["companyId", "input"]),
  },
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));

const ensureAuthDir = async () => {
  await mkdir(AUTH_DIR, { recursive: true, mode: 0o700 });
};
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => {
  await ensureAuthDir();
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
};

const createPkceVerifier = () => randomBytes(48).toString("base64url");
const createPkceChallenge = (verifier) => createHash("sha256").update(verifier).digest("base64url");

const startOAuth = async (args) => {
  const baseUrl =
    typeof args.agencyBaseUrl === "string" && args.agencyBaseUrl.trim()
      ? args.agencyBaseUrl.trim().replace(/\/+$/g, "")
      : DEFAULT_AGENCY_BASE_URL;
  const verifier = createPkceVerifier();
  const state = randomBytes(20).toString("base64url");
  await writeJson(PENDING_AUTH_PATH, {
    baseUrl,
    codeVerifier: verifier,
    redirectUri: OOB_REDIRECT_URI,
    state,
  });
  const url = new URL(`${baseUrl}/api/developer/oauth/authorize`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DEVELOPER_SCOPE);
  url.searchParams.set("redirect_uri", OOB_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", createPkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return {
    authorizationUrl: url.toString(),
    nextStep: "Open the URL, sign in to Agency, then call agency_oauth_finish with the displayed code.",
  };
};

const finishOAuth = async (args) => {
  const pending = await readJson(PENDING_AUTH_PATH);
  const response = await fetch(`${pending.baseUrl}/api/developer/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      code: args.code,
      code_verifier: pending.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: pending.redirectUri,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Agency OAuth exchange failed with ${response.status}`);
  }
  await writeJson(AUTH_PATH, {
    accessToken: payload.access_token,
    baseUrl: pending.baseUrl,
    expiresAt: Date.now() + payload.expires_in * 1000,
    refreshToken: payload.refresh_token,
  });
  return {
    connected: true,
    scope: payload.scope,
  };
};

const refreshOAuth = async (auth) => {
  const response = await fetch(`${auth.baseUrl}/api/developer/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Agency OAuth refresh failed with ${response.status}`);
  }
  const next = {
    accessToken: payload.access_token,
    baseUrl: auth.baseUrl,
    expiresAt: Date.now() + payload.expires_in * 1000,
    refreshToken: payload.refresh_token || auth.refreshToken,
  };
  await writeJson(AUTH_PATH, next);
  return next;
};

const loadAuth = async () => {
  let auth;
  try {
    auth = await readJson(AUTH_PATH);
  } catch {
    throw new Error("Agency plugin is not connected. Run agency_oauth_start, authorize it, then run agency_oauth_finish.");
  }
  if (!auth.accessToken || !auth.baseUrl || !auth.refreshToken) {
    throw new Error("Agency plugin credentials are incomplete. Reconnect through OAuth.");
  }
  if (typeof auth.expiresAt !== "number" || auth.expiresAt <= Date.now() + 30_000) {
    return await refreshOAuth(auth);
  }
  return auth;
};

const requestAgency = async (path, { body, method = "GET" } = {}) => {
  let auth = await loadAuth();
  const perform = async () =>
    await fetch(`${auth.baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${auth.accessToken}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  let response = await perform();
  if (response.status === 401) {
    auth = await refreshOAuth(auth);
    response = await perform();
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Agency developer API request failed with ${response.status}`);
  }
  return payload;
};

const readTextIfExists = async (path) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
};
const assertProjectDir = async (projectDir) => {
  const resolved = resolve(projectDir);
  const info = await stat(resolved);
  if (!info.isDirectory()) {
    throw new Error("projectDir must point to an existing repository directory.");
  }
  return resolved;
};
const renderManagedEnv = (environment) =>
  [
    ENV_BEGIN,
    ...Object.entries(environment)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${JSON.stringify(String(value))}`),
    ENV_END,
  ].join("\n");
const mergeManagedEnv = (existing, managed) => {
  const pattern = new RegExp(`${ENV_BEGIN}[\\s\\S]*?${ENV_END}\\n?`, "m");
  const trimmedExisting = existing.replace(pattern, "").trimEnd();
  return `${trimmedExisting ? `${trimmedExisting}\n\n` : ""}${managed}\n`;
};

const toolCall = async (name, args = {}) => {
  switch (name) {
    case "agency_oauth_start":
      return await startOAuth(args);
    case "agency_oauth_finish":
      return await finishOAuth(args);
    case "agency_list_companies":
      return await requestAgency("/api/developer/companies");
    case "agency_match_company_repository":
      return await requestAgency("/api/developer/companies/match", { method: "POST", body: args });
    case "agency_discover_capabilities":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/capabilities`);
    case "agency_sync_local_env": {
      const bundle = await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/env`, {
        method: "POST",
        body: { provisionDatabase: args.provisionDatabase ?? true },
      });
      const projectDir = await assertProjectDir(args.projectDir);
      const envPath = join(projectDir, ".env.local");
      const next = mergeManagedEnv(await readTextIfExists(envPath), renderManagedEnv(bundle.environment ?? {}));
      await writeFile(envPath, next, "utf8");
      return {
        bindingsDigest: bundle.bindingsDigest,
        envPath,
        keys: Object.keys(bundle.environment ?? {}).toSorted(),
        moduleStates: bundle.moduleStates,
      };
    }
    case "agency_issue_push_access":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/repository/push-access`, { method: "POST" });
    case "agency_get_deploy_state":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/deployments/state`);
    case "agency_trigger_deploy":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/deployments/deploy`, { method: "POST" });
    case "agency_get_integrations":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/integrations`);
    case "agency_set_integration_state":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/integrations/state`, {
        method: "POST",
        body: { configured: args.configured, enabled: args.enabled, key: args.key },
      });
    case "agency_get_email_state":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/email/state`);
    case "agency_start_email_setup":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/email/setup`, { method: "POST" });
    case "agency_get_event_catalog":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/events/catalog`);
    case "agency_list_agents":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/agents`);
    case "agency_create_custom_agent":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/agents/custom`, { method: "POST", body: args.input });
    case "agency_install_managed_agent":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/agents/managed`, { method: "POST", body: { slug: args.slug } });
    case "agency_update_custom_agent":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/agents/custom`, { method: "PATCH", body: args.input });
    case "agency_rebuild_agent":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/agents/rebuild`, { method: "POST", body: { agentId: args.agentId } });
    case "agency_remove_agent":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/agents/remove`, { method: "POST", body: { agentId: args.agentId } });
    case "agency_list_routines":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines`);
    case "agency_get_routine":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/detail/${encodeURIComponent(args.lifecycleId)}`);
    case "agency_create_routine":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/create`, { method: "POST", body: args.input });
    case "agency_create_routine_with_trigger":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/create-with-trigger`, { method: "POST", body: args.input });
    case "agency_update_routine":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/update`, { method: "PATCH", body: args.input });
    case "agency_remove_routine":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/remove`, { method: "POST", body: { lifecycleId: args.lifecycleId } });
    case "agency_create_routine_trigger":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/trigger/create`, { method: "POST", body: args.input });
    case "agency_update_routine_trigger":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/trigger/update`, { method: "PATCH", body: args.input });
    case "agency_remove_routine_trigger":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/trigger/remove`, { method: "POST", body: { triggerId: args.triggerId } });
    case "agency_list_routine_templates":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/templates`);
    case "agency_install_routine_template":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/routines/templates/install`, { method: "POST", body: { templateKey: args.templateKey } });
    case "agency_get_payment_catalog":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/payments/catalog`);
    case "agency_upsert_payment_product":
      return await requestAgency(`/api/developer/companies/${encodeURIComponent(args.companyId)}/payments/products/upsert`, { method: "POST", body: args.input });
    default:
      throw new Error(`Unknown Agency tool: ${name}`);
  }
};

let buffer = Buffer.alloc(0);
const writeMessage = (message) => {
  const serialized = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(serialized, "utf8")}\r\n\r\n${serialized}`);
};
const handleMessage = async (message) => {
  const id = message.id;
  if (message.method === "initialize") {
    return writeMessage({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: message.params?.protocolVersion ?? "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "agency", version: "1.0.0" },
      },
    });
  }
  if (message.method === "notifications/initialized") {
    return;
  }
  if (message.method === "tools/list") {
    return writeMessage({ jsonrpc: "2.0", id, result: { tools } });
  }
  if (message.method === "tools/call") {
    try {
      const name = message.params?.name;
      if (!toolByName.has(name)) {
        throw new Error(`Unknown Agency tool: ${String(name)}`);
      }
      const output = await toolCall(name, message.params?.arguments ?? {});
      return writeMessage({ jsonrpc: "2.0", id, result: textResult(output) });
    } catch (error) {
      return writeMessage({
        jsonrpc: "2.0",
        id,
        result: errorResult(error instanceof Error ? error.message : "Agency tool failed."),
      });
    }
  }
  if (id !== undefined) {
    return writeMessage({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${String(message.method)}` },
    });
  }
};
const consumeBuffer = async () => {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd < 0) return;
    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const lengthMatch = header.match(/content-length:\s*(\d+)/i);
    if (!lengthMatch) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }
    const length = Number(lengthMatch[1]);
    const payloadStart = headerEnd + 4;
    const payloadEnd = payloadStart + length;
    if (buffer.length < payloadEnd) return;
    const payload = buffer.subarray(payloadStart, payloadEnd).toString("utf8");
    buffer = buffer.subarray(payloadEnd);
    await handleMessage(JSON.parse(payload));
  }
};
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  void consumeBuffer();
});
