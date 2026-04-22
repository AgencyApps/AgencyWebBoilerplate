import Head from "next/head";
import { api } from "~/utils/api";

export default function HomePage() {
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
              Pages Router, tRPC, optional Drizzle/Postgres, Tailwind, TypeScript, oxfmt, and
              oxlint are wired together with a narrow default surface.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatusTile label="tRPC" value={healthQuery.data?.ok ? "online" : "checking"} />
            <StatusTile label="Service" value={healthQuery.data?.service ?? "starter"} />
            <StatusTile label="Updated" value={healthQuery.data?.timestamp ? "live" : "pending"} />
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
