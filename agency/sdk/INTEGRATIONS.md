# Integration implementation notes

Agency keeps Auth, Billing, and Analytics behind an explicit readiness gate. Implement the module in app code first, then send the matching readiness probe so Agency can open the live surface.

## Auth

- Import from `agency/sdk/auth`.
- Keep `src/pages/api/agency/auth/*`; those routes handle the redirect start, callback exchange, app session lookup, and app-local sign-out.
- Import `useAgencyAuth()` from `agency/sdk/auth-react` in the app UI when you need Sign in with Agency, the current propagated user, or linked account provider metadata.
- Use `getAgencyAuthSession(...)` from `agency/sdk/auth` in trusted server code when an API route needs the current Agency-backed app user.
- The first successful redirect-code exchange marks Auth live from Agency automatically and fills the Auth/Customers data path.

## Billing

- Import from `agency/sdk/payments`.
- Use Agency's merchant-of-record helpers for products, prices, checkout, refunds, billing reads, and normalized billing event reads.
- For natural-language tasks like adding a product, prefer `upsertAgencyProduct(...)` with a stable `catalogKey` so repeated runs reconcile the same catalog item instead of duplicating it.
- Build success and cancel customer UX, but do not mark an order paid solely from the success URL redirect.
- Use `listAgencyPaymentEvents()` or typed billing reads for fulfillment or entitlement state backed by Agency's signed Stripe webhook processing.
- Do not add Stripe credentials or a Stripe SDK directly to the app.
- Once billing is wired in trusted server code, call:

```ts
import { initializeAgencyIntegration } from "agency/sdk/platform";

await initializeAgencyIntegration("billing");
```

Accepted normalized billing events also mark Payments live if the explicit probe was skipped.

## Analytics

- Import server helpers from `agency/sdk/analytics`.
- Import browser hooks from `agency/sdk/analytics-react`.
- Add product events where they explain real user behavior; page-view tracking alone is not the whole integration.
- Once analytics hooks are present, call:

```ts
import { initializeAgencyIntegration } from "agency/sdk/platform";

await initializeAgencyIntegration("analytics");
```

Accepted analytics events also mark Analytics live if the explicit probe was skipped.

## Runtime assumptions

- Agency injects the scoped `AGENCY_*` values when the module is enabled.
- The live Agency control-plane domain is `https://agency.weights.com`.
- Do not fake init events or emit them before the product flow exists; the Agency dashboard treats them as the readiness boundary.
