---
name: agency
description: Use when creating, adapting, modifying, or shipping an Agency company app from AgencyWebBoilerplate or a bring-your-own repository. Guides Codex through SDK-first product changes, company-scoped platform flows, Payments catalog work, repository reconciliation, and delivery to the Agency remote.
---

# Agency

Use this skill when the user wants Codex to prepare an Agency app, modify an existing company product, reconcile an older repo with Agency conventions, implement platform-backed flows, or ship a repo-backed company change through Agency.

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
4. Implement the requested product work in place with Agency SDKs and runtime bindings as the default platform layer.
5. Build or otherwise run the repo's normal verification step before shipping meaningful changes.
6. For Agency setup/integration prompts that already imply delivery, or when the user explicitly asks to ship, commit the repo state and push `main` to the authenticated Agency remote.

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
- `src/pages/api/agency/auth/*` when Sign in with Agency is needed,
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
- Billing becomes live after trusted server code calls `initializeAgencyIntegration("billing")`, or after the first accepted normalized billing event.
- Analytics becomes live after trusted server code calls `initializeAgencyIntegration("analytics")`, or after the first accepted analytics event.

## Payments Product Changes

When the user asks for a Payments change such as "add a product", "add a paid plan", or "sell this tier":

1. Treat it as a real product implementation task, not a documentation or brainstorming task.
2. Prefer the canonical catalog reconciliation contract exposed by the Agency Payments SDK, especially `upsertAgencyProduct(...)` in app code.
3. Use a stable lowercase `catalogKey` so repeated work updates the same product instead of creating duplicates.
4. Wire the app-side checkout/product UX through `agency/sdk/payments`.
5. Keep success and cancel screens as customer UX only; payment truth comes from Agency billing reads or normalized billing events.
6. Call `initializeAgencyIntegration("billing")` from trusted server code once the real Payments flow exists.
7. If this work originated from Agency setup or the user asked to ship it, build, commit, and push `main` so Agency deployment can follow.

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

Push when the request includes activation/publishing, when an Agency setup/integration prompt already asks Codex to implement and ship, or when the user explicitly asks Codex to complete the push. After a successful push, say Agency deployment follows the `main` push.
