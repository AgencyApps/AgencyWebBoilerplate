import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({
    ok: true,
    service: "agency-web-boilerplate",
    timestamp: new Date().toISOString(),
  })),
});
