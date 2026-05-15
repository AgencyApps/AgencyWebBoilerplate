# Email And Event Recipes

## "When A New User Signs Up, Send A Follow Up Email"

1. Run `agency_discover_capabilities`.
2. Inspect Auth product readiness and Email platform readiness with `agency_get_integrations`.
3. If Email is not configured, use `agency_get_email_state` and `agency_start_email_setup` when setup should proceed.
4. Read `agency_list_routine_templates`.
5. Prefer the `new-signup-follow-up` starter when available.
6. If a custom behavior is required, use the event catalog to confirm `customer.created`, create or select an agent with email/customer capabilities, then create the routine and event trigger.
7. Make any necessary repo-side Auth or customer-product changes, sync env if needed, verify, and ship both remotes when delivery is implied.

## "Add This New Product To My Site"

1. Run `agency_discover_capabilities` and `agency_sync_local_env` if Agency bindings are not already local.
2. Call `agency_upsert_payment_product` with a stable catalog key and explicit pricing.
3. Implement app UX with `agency/sdk/payments`.
4. Read normalized billing state for fulfillment instead of trusting redirect URLs.
5. Initialize Billing readiness after the real flow exists, verify the repo, then push origin and Agency remotes when shipping is implied.
