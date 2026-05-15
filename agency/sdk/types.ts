export type AgencyModuleKind = "auth" | "database" | "billing" | "analytics" | "storage";

export type AgencyPlatformCapability = "events" | "lifecycles";

export type AgencyManifestModule = {
  kind: AgencyModuleKind;
  status: string;
  env: Record<string, string>;
  metadata: Record<string, unknown>;
};

export type AgencyManifest = {
  appId: string;
  modules: AgencyManifestModule[];
};
