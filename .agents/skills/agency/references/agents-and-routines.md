# Agents And Routines

- Discover the current control plane with `agency_discover_capabilities`.
- Read available agents with `agency_list_agents`; create custom agents or install managed agents only when the task actually needs an Agency-side worker.
- Use `agency_get_event_catalog` before inventing an event trigger. Prefer actual triggerable event types surfaced by Agency.
- Use routine tools for durable automation:
  - list/get routines,
  - create/update/remove routines,
  - create/update/remove routine triggers.
- Prefer `agency_list_routine_templates` before hand-authoring a routine that matches a known starter.
- Install the signup follow-up starter with `agency_install_routine_template` when Auth and Email are ready and the user asks for that behavior.
- Keep repo-side product work and Agency account automation coherent: if the routine depends on app events or product semantics, implement those repo changes too.
