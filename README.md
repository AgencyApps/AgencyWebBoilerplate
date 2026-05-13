# Agency Web Boilerplate

Opinionated starter for Agency-generated webapps.

## Stack

- Next.js Pages Router
- tRPC + TanStack Query
- Drizzle + Postgres, optional until app code needs it
- Tailwind v4
- TypeScript
- oxfmt + oxlint

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`DATABASE_URL` is optional for local boot, build, and deployment. Set it when the app needs Postgres, then push the schema:

```bash
pnpm db:push
```

## Codex Agency skill

This repo publishes the reusable Codex skill at `.agents/skills/agency`.

From Codex, install it with:

```text
Use $skill-installer to install the Agency skill from https://github.com/AgencyApps/AgencyWebBoilerplate/tree/main/.agents/skills/agency
```

Restart Codex after install, then use `$agency` when you want Codex to bootstrap an Agency app, keep the app on the expected platform conventions, or complete the first Agency push.

## Optional R2

Set these only when the app needs blob storage:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Generated projects can add their own object key conventions in app code.

## Agency runtime

Agency provisions each company app as a standalone GitHub repository copied from this boilerplate.
This public boilerplate is also the canonical Agency SDK reference for older generated repos and bring-your-own codebases.
New generated apps receive the local SDK substrate by default.
When an older or BYO repo needs Agency SDK support, vendor only the pieces that integration requires from this repo:

- the required `agency/sdk/*` modules,
- `AGENCY_SDK.md` plus `agency/sdk/INTEGRATIONS.md` when local guidance is absent or stale,
- the `agency/*` TypeScript path alias when the target repo cannot resolve those imports,
- `src/pages/api/agency/auth/*` when the target app needs Sign in with Agency,
- `src/pages/api/agency/analytics.ts` only when browser analytics needs the local proxy route.

Preserve the target app's product-specific work instead of resetting unrelated files from this boilerplate.
Northflank deploys the copied repository through the included Dockerfile, which runs the standard `build` and `start` scripts.
Agents should treat this repo as a normal Next.js webapp and use Drizzle/Postgres only when the product needs persistence.
This boilerplate includes local `agency/sdk/*` helpers for auth, database, payments, analytics, and platform reads.
Agency injects the correctly scoped `AGENCY_*` and `DATABASE_URL` bindings for enabled modules at runtime; use those SDKs before adding bespoke provider code, and do not store live runtime credentials in the repo.
Auth is wired as a redirect-code Sign in with Agency flow. The starter page already exposes it through `useAgencyAuth()`, and the bundled `/api/agency/auth/*` routes handle the server exchange, HttpOnly app session cookie, current user/account lookup, and local sign-out.
For billing, Agency is the merchant of record, so use `agency/sdk/payments` instead of adding Stripe directly.
For product analytics, use `agency/sdk/analytics` on the server and `agency/sdk/analytics-react` in the browser. The default app shell already mounts a page-view tracker that records `page_viewed` when analytics is enabled.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm format:check
pnpm db:push
```
