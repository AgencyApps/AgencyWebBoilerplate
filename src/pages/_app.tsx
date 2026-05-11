import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { useState } from "react";
import { AgencyAnalyticsPageTracker } from "agency/sdk/analytics-react";
import { api, createTrpcClient } from "~/utils/api";
import "~/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTrpcClient());

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AgencyAnalyticsPageTracker />
        <Component {...pageProps} />
      </QueryClientProvider>
    </api.Provider>
  );
}
