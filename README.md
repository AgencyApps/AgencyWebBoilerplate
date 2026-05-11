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

## Optional R2

Set these only when the app needs blob storage:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Generated projects can add their own object key conventions in app code.

## Agency runtime

Agency provisions each company app as a standalone GitHub repository copied from this boilerplate.
Northflank deploys the copied repository through the included Dockerfile, which runs the standard `build` and `start` scripts.
Agents should treat this repo as a normal Next.js webapp and use Drizzle/Postgres only when the product needs persistence.
This boilerplate includes local `agency/sdk/*` helpers for auth, database, payments, analytics, and platform reads.
Agency injects the correctly scoped `AGENCY_*` and `DATABASE_URL` bindings for enabled modules at runtime; use those SDKs before adding bespoke provider code.
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
