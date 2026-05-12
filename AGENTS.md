Do not use migrations; use `pnpm db:push`.
Do not write tests unless explicitly asked.
Treat this as a standard Next.js webapp deployed from GitHub to Northflank.
`DATABASE_URL` is optional until product code actually uses Drizzle/Postgres.
This public boilerplate is the canonical Agency SDK reference for generated apps, older generated repos, and bring-your-own codebases. New generated apps receive this SDK substrate by default.
When an older or BYO repo needs Agency SDK support, vendor only the integration substrate it needs from this repo: the required `agency/sdk/*` modules, `AGENCY_SDK.md` plus `agency/sdk/INTEGRATIONS.md` when local guidance is absent or stale, the `agency/*` TypeScript path alias when imports would not resolve, and `src/pages/api/agency/analytics.ts` only when browser analytics needs the local proxy route. Preserve product-specific app work instead of resetting unrelated files from the boilerplate.
Use the local `agency/sdk/*` modules before adding bespoke platform integrations.
Available SDKs:
- `agency/sdk/auth` for auth config and session-token exchange against Agency.
- `agency/sdk/database` for app database config via `DATABASE_URL`.
- `agency/sdk/payments` for catalog, checkout, refund, and billing reads through Agency.
- `agency/sdk/analytics` for normalized event writes through Agency.
- `agency/sdk/analytics-react` for browser event hooks like page views and client actions.
- `agency/sdk/platform` for module manifest and platform event reads.
Agency injects correctly scoped `AGENCY_*` env vars for enabled modules at runtime. Assume those bindings exist when the module is enabled; do not reimplement the provider wiring in this repo.
Read `agency/sdk/INTEGRATIONS.md` before implementing Auth, Billing, or Analytics. Those modules stay hidden in Agency until the app emits the documented init signal:
- Auth becomes live after the first successful `exchangeAgencyAuthToken(...)` flow.
- Billing becomes live after trusted server code calls `initializeAgencyPaymentsIntegration()`.
- Analytics becomes live after trusted server code calls `initializeAgencyAnalyticsIntegration()`.
Do not add direct Stripe or analytics vendor SDKs, and do not store platform secrets or live Agency runtime credentials in this repo.
