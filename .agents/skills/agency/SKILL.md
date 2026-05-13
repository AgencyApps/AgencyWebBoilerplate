---
name: agency
description: Use when creating, adapting, or shipping an Agency app from AgencyWebBoilerplate or a bring-your-own repository. Guides Codex through boilerplate bootstrap, Agency architecture defaults, SDK/runtime decisions, repository reconciliation, and the first push to the Agency remote.
---

# Agency

Use this skill when the user wants Codex to prepare an app for Agency, start from the public Agency boilerplate, reconcile an existing repo with Agency conventions, or complete the first push that activates an Agency company workspace.

## Workflow

1. Classify the repository state before changing files.
   - If the target directory does not exist yet, bootstrap from `https://github.com/AgencyApps/AgencyWebBoilerplate.git`.
   - If the user already has product code, preserve it. Do not reset unrelated files to match the boilerplate.
   - If an older or BYO repo only needs Agency platform support, vendor only the missing Agency substrate that the task actually needs.
2. Read the local project instructions first.
   - Respect `AGENTS.md`.
   - In boilerplate-derived repos, read `AGENCY_SDK.md` before changing platform integrations.
   - Read `agency/sdk/INTEGRATIONS.md` before implementing Auth, Billing, or Analytics.
3. Keep the architecture aligned with Agency defaults unless the user explicitly asks otherwise.
4. Implement the requested product work in place.
5. When the task includes activation, connect the authenticated Agency remote and push the real repo state to `main`.

## Bootstrap A New Agency App

For a new app, prefer the public canonical boilerplate:

```bash
git clone https://github.com/AgencyApps/AgencyWebBoilerplate.git <project-dir>
cd <project-dir>
```

Then work inside that repo. Keep the boilerplate's package manager and app structure intact unless the user asks for a deliberate replacement.

Default assumptions:

- Next.js Pages Router
- tRPC + TanStack Query
- Tailwind v4
- TypeScript
- Drizzle + Postgres only when the product needs persistence
- GitHub-backed deployment through Agency/Northflank
- `pnpm` scripts from the repo

Do not introduce Prisma migrations. When database schema changes are genuinely needed, use `pnpm db:push`.

## Adapt A BYO Or Older Repo

When a repo already exists, inspect it before importing anything. Preserve product-specific code, package choices, and working app structure whenever possible.

If Agency support is missing or stale, use `AgencyWebBoilerplate` as the canonical reference and vendor only what is required:

- the relevant `agency/sdk/*` modules,
- `AGENCY_SDK.md` plus `agency/sdk/INTEGRATIONS.md` when local guidance is absent or stale,
- the `agency/*` TypeScript path alias when imports would not resolve,
- `src/pages/api/agency/analytics.ts` only when browser analytics needs the local proxy route.

Do not replace unrelated files, regenerate the entire app, or bolt on a package-manager/versioning scheme just to reconcile older repos.

## Agency Runtime And SDK Rules

Use the local Agency SDK modules before creating bespoke platform integrations:

- `agency/sdk/auth`
- `agency/sdk/database`
- `agency/sdk/payments`
- `agency/sdk/analytics`
- `agency/sdk/analytics-react`
- `agency/sdk/platform`

Treat Agency-provisioned runtime bindings as the contract. Agency injects scoped `AGENCY_*` values for enabled modules and `DATABASE_URL` when database support is provisioned. Do not hardcode live credentials or invent competing provider wiring in the app repo.

Important integration decisions:

- Billing uses Agency as merchant of record. Do not add direct Stripe integrations.
- Product analytics should use the local Agency analytics SDKs, not a separate vendor SDK by default.
- Auth becomes live after the first successful `exchangeAgencyAuthToken(...)` flow.
- Billing becomes live after trusted server code calls `initializeAgencyPaymentsIntegration()`.
- Analytics becomes live after trusted server code calls `initializeAgencyAnalyticsIntegration()`.

## Push To Agency

Agency setup activates after a real first push to the authenticated company repository on `main`.

When the user provides the Agency push URL from setup:

```bash
git remote add agency "<authenticated-push-url>"
git push agency main
```

Before mutating remotes, inspect whether `agency` already exists.

- If it already points to the same destination, keep it.
- If it points somewhere else, stop and ask before changing it.
- If the current local branch is intentionally not named `main`, explain the branch mapping before using `git push agency HEAD:main`.

Only push when the user's request includes activation/publishing or they explicitly ask Codex to complete the push. After a successful first push, tell them Agency should unlock once webhook/polling sees `main`.
