import { createNextApiHandler } from "@trpc/server/adapters/next";
import type { NodeHTTPHandlerOptions } from "@trpc/server/adapters/node-http";
import type { NextApiRequest, NextApiResponse } from "next";
import { type AppRouter, appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const onError: NodeHTTPHandlerOptions<AppRouter, NextApiRequest, NextApiResponse>["onError"] =
  process.env.NODE_ENV === "development"
    ? ({ error, path }) => {
        console.error(`[trpc] ${path ?? "unknown"} failed`, error);
      }
    : undefined;

export const config = {
  api: {
    responseLimit: false,
  },
};

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError,
});
