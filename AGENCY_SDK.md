# Agency SDK

Use the local `agency/sdk/*` modules before adding bespoke platform integrations.
This public boilerplate is the canonical Agency SDK reference for generated apps, older generated repos, and bring-your-own codebases.
Generated apps receive this SDK substrate by default.

When an older or BYO repo needs Agency SDK support, vendor only the integration substrate it needs from this repo:

- the required `agency/sdk/*` modules,
- this `AGENCY_SDK.md` file plus `agency/sdk/INTEGRATIONS.md` when local guidance is absent or stale,
- the `agency/*` TypeScript path alias when imports would not resolve,
- `src/pages/api/agency/analytics.ts` only when browser analytics needs the local proxy route.

Preserve product-specific app work instead of resetting unrelated files from the boilerplate.

Agency injects the matching `AGENCY_*` env vars at runtime when a module is enabled for the app. Treat these helpers as the default integration surface.
Do not store live Agency runtime credentials in the repo.
Agency exposes the control-plane API at `https://agency.weights.com`; generated apps should use the injected URLs rather than inventing local API endpoints.

For integration-specific implementation steps and dashboard activation rules, also read `agency/sdk/INTEGRATIONS.md`.

## Available modules

- `agency/sdk/auth`
  - Read auth config with `getAgencyAuthConfig()`.
  - Exchange a session token with `exchangeAgencyAuthToken(...)`.
- `agency/sdk/database`
  - Read the app database binding with `getAgencyDatabaseConfig()`.
- `agency/sdk/payments`
  - Create products, prices, checkout sessions, and refunds.
  - Read billing dashboard and catalog data.
- `agency/sdk/analytics`
  - Send normalized product or business events with `trackAgencyEvent(...)`.
- `agency/sdk/analytics-react`
  - Use `useAgencyAnalytics()` for client-side event recording.
  - Use `useAgencyPageView()` or `<AgencyAnalyticsPageTracker />` for page-view hooks.
- `agency/sdk/platform`
  - Read the Agency module manifest and platform event feed for this app.
- `agency/sdk/types`
  - Shared module and manifest types.

## Payments

- Import `agency/sdk/payments` for catalog writes, checkout creation, refunds, and billing reads.
- The Agency platform is the merchant of record.
- This repo should never contain direct Stripe keys or a direct Stripe SDK integration.
- The Agency runtime injects:
  - `AGENCY_PAYMENTS_BASE_URL`
  - `AGENCY_PAYMENTS_APP_ID`
  - `AGENCY_PAYMENTS_ACCESS_TOKEN`

Write helpers in `agency/sdk/payments` are server-only. Call them from API routes, server actions, or other trusted server code.

Once the billing flow is wired, call:

```ts
import { initializeAgencyPaymentsIntegration } from "agency/sdk/payments";

await initializeAgencyPaymentsIntegration();
```

That emits the Billing init signal Agency waits for before showing the live Billing dashboard.

## Auth

- `agency/sdk/auth` reads:
  - `AGENCY_AUTH_ISSUER_URL`
  - `AGENCY_AUTH_BASE_URL`
  - `AGENCY_AUTH_AUDIENCE`
  - `AGENCY_AUTH_APP_ID`
  - `AGENCY_AUTH_EXCHANGE_URL`
- The first successful `exchangeAgencyAuthToken(...)` call marks Auth live in Agency.

## Analytics

- `agency/sdk/analytics` reads:
  - `AGENCY_ANALYTICS_BASE_URL`
  - `AGENCY_ANALYTICS_APP_ID`
  - `AGENCY_ANALYTICS_WRITE_KEY`
- Use `trackAgencyServerEvent(...)` from trusted server code when you already have access to injected env vars.
- Use `trackAgencyBrowserEvent(...)` or `useAgencyAnalytics()` from React code to send client events through the local `/api/agency/analytics` proxy route.
- The default `_app.tsx` mounts a page-view tracker, so `page_viewed` events start flowing automatically once the analytics module is enabled.
- After analytics hooks are in place, call `initializeAgencyAnalyticsIntegration()` from trusted server code. Agency waits for that init event before showing the live Analytics dashboard.

Example browser usage:

```tsx
import { useAgencyAnalytics } from "agency/sdk/analytics-react";

export function UpgradeButton() {
  const { track } = useAgencyAnalytics();

  return (
    <button
      onClick={() => {
        void track({
          name: "upgrade_cta_clicked",
          properties: { placement: "hero" },
        });
      }}
      type="button"
    >
      Upgrade
    </button>
  );
}
```

## Database

- `agency/sdk/database` reads:
  - `DATABASE_URL`

## Platform

- `agency/sdk/platform` reads:
  - `AGENCY_BASE_URL`, or falls back to Agency auth base/issuer URLs when present.
  - If no runtime base URL is present, the helper falls back to `https://agency.weights.com`.
