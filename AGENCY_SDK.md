# Agency SDK

Use the local `agency/sdk/*` modules before adding bespoke platform integrations.

Agency injects the matching `AGENCY_*` env vars at runtime when a module is enabled for the app. Treat these helpers as the default integration surface.
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
