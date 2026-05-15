# Product Integrations

## Auth

- Use `agency/sdk/auth`, `agency/sdk/auth-react`, and the bundled `src/pages/api/agency/auth/*` routes.
- The first successful redirect-code exchange marks Auth live and populates Agency customer state.
- App code should not decode Agency tokens or query Agency account tables directly.

## Payments

- Agency is merchant of record. Do not add direct Stripe SDKs or Stripe credentials in the app repo.
- For prompts such as "add this new product", call `agency_upsert_payment_product` with a stable lowercase catalog key before wiring repo-side UX.
- Use `agency/sdk/payments` for checkout and billing reads.
- Treat signed Agency billing events or Agency billing reads as payment truth; a success redirect is only customer UX.
- Call `initializeAgencyIntegration("billing")` from trusted server code after the real flow exists.

## Analytics

- Use `agency/sdk/analytics` for server events and `agency/sdk/analytics-react` for browser events.
- The bundled page-view tracker is useful but does not replace meaningful business/product events.
- Call `initializeAgencyIntegration("analytics")` after the instrumentation is real.
