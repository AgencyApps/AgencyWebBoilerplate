import Head from "next/head";
import { useAgencyAuth } from "agency/sdk/auth-react";
import { api } from "~/utils/api";

export default function HomePage() {
  const auth = useAgencyAuth();
  const healthQuery = api.health.ping.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <>
      <Head>
        <title>Agency Web App</title>
        <meta content="An Agency webapp starter." name="description" />
      </Head>
      <main className="min-h-screen bg-[#f7f7f4] text-[#181817]">
        <section className="mx-auto grid min-h-screen w-full max-w-5xl content-center gap-8 px-6 py-16">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#6d6a62]">
              Agency web starter
            </p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
              A small full-stack webapp, ready to shape.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#55524b]">
              Pages Router, tRPC, optional Drizzle/Postgres, Tailwind, TypeScript, oxfmt, and oxlint
              are wired together with a narrow default surface.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatusTile label="tRPC" value={healthQuery.data?.ok ? "online" : "checking"} />
            <StatusTile label="Service" value={healthQuery.data?.service ?? "starter"} />
            <StatusTile
              label="Agency auth"
              value={auth.authenticated ? "signed in" : auth.isLoading ? "checking" : "ready"}
            />
          </div>

          <section className="grid gap-4 border border-[#dedbd2] bg-white p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[#181817]">
                {auth.user ? auth.user.name : "Sign in with Agency"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#55524b]">
                {auth.user
                  ? `${auth.user.email} · ${auth.accounts.map((account) => account.providerId).join(", ") || "Agency account"}`
                  : "Use the inherited Agency identity flow. The app receives the user profile and linked account providers after sign-in."}
              </p>
              {auth.error ? <p className="mt-2 text-sm text-[#9f1d1d]">{auth.error}</p> : null}
            </div>
            {auth.authenticated ? (
              <button
                className="h-11 border border-[#c9c4b8] px-4 text-sm font-semibold text-[#181817]"
                onClick={() => void auth.signOut()}
                type="button"
              >
                Sign out
              </button>
            ) : (
              <button
                className="h-11 bg-[#181817] px-4 text-sm font-semibold text-white"
                disabled={auth.isLoading}
                onClick={() => auth.signIn("/")}
                type="button"
              >
                Sign in with Agency
              </button>
            )}
          </section>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatusTile label="Updated" value={healthQuery.data?.timestamp ? "live" : "pending"} />
            <StatusTile label="User data" value={auth.user ? "propagated" : "waiting"} />
            <StatusTile
              label="Accounts"
              value={auth.accounts.length > 0 ? `${auth.accounts.length} linked` : "none"}
            />
          </div>
        </section>
      </main>
    </>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#dedbd2] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#77736a]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
