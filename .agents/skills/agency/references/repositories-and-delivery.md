# Repositories And Delivery

## Bootstrap Or Reconcile

- New Agency apps can start from `https://github.com/AgencyApps/AgencyWebBoilerplate.git`.
- Existing product repos stay authoritative. Preserve product work and vendor only missing Agency SDK/docs/routes that the task actually needs.
- Before choosing a company, use `agency_match_company_repository` with local git remotes. Use `agency_list_companies` only when the repo does not resolve cleanly.

## Shipping

- Delivery uses two remotes by default: the user's own origin and Agency's deployment remote.
- Use `agency_issue_push_access` to obtain a fresh authenticated Agency remote URL.
- Inspect existing remotes before changing them.
- Push the current user-facing branch to origin as normal.
- Push Agency deployment state to `main`; when the local branch is not named `main`, use an explicit mapping such as `HEAD:main`.
- If origin is missing, ambiguous, or points somewhere unsafe, stop and report that blocker instead of claiming dual delivery succeeded.
- A successful Agency `main` push triggers deployment. Use `agency_get_deploy_state` to inspect progress, and `agency_trigger_deploy` only for an explicit retry or recovery flow.
