# Local Env, Data, And Storage

- Run `agency_sync_local_env` before local work that needs Agency modules, hosted Postgres, or runtime-scoped credentials.
- The tool updates only the managed Agency block inside `.env.local`; preserve all unrelated local variables.
- Treat Agency's hosted `DATABASE_URL` as the app database in local development and deployment. Do not invent a separate local database contract unless the user explicitly asks.
- When schema changes are needed, use `pnpm db:push`. Do not introduce migrations.
- Use `agency/sdk/database` to read database binding presence in app code.
- Public app uploads use `agency/sdk/storage`.
  - Request upload tickets from trusted server code.
  - Upload bytes to the returned presigned URL and headers.
  - Persist returned keys or public URLs in app data.
  - Delete app-owned public objects through the storage helper.
- Do not add raw R2 credentials, private-file semantics, or credential storage to the sub-app repo.
