# Integration implementation notes

Agency keeps Auth, Billing, and Analytics behind an explicit init-event gate. Implement the module in app code first, then emit the matching init signal so Agency can show the live dashboard.

## Auth

- Import from `agency/sdk/auth`.
- Use `getAgencyAuthConfig()` for runtime URLs and app identity.
- Exchange the Agency session token with `exchangeAgencyAuthToken(...)` in the real sign-in flow.
- The first successful exchange emits the Auth init signal from Agency automatically.

## Billing

- Import from `agency/sdk/payments`.
- Use Agency's merchant-of-record helpers for products, prices, checkout, refunds, and billing reads.
- Do not add Stripe credentials or a Stripe SDK directly to the app.
- Once billing is wired in trusted server code, call:

```ts
import { initializeAgencyPaymentsIntegration } from "agency/sdk/payments";

await initializeAgencyPaymentsIntegration();
```

## Analytics

- Import server helpers from `agency/sdk/analytics`.
- Import browser hooks from `agency/sdk/analytics-react`.
- Add product events where they explain real user behavior; page-view tracking alone is not the whole integration.
- Once analytics hooks are present, call:

```ts
import { initializeAgencyAnalyticsIntegration } from "agency/sdk/analytics";

await initializeAgencyAnalyticsIntegration();
```

## Runtime assumptions

- Agency injects the scoped `AGENCY_*` values when the module is enabled.
- The live Agency control-plane domain is `https://agency.weights.com`.
- Do not fake init events or emit them before the product flow exists; the Agency dashboard treats them as the readiness boundary.
