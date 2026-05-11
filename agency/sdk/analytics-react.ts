import { useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/router";
import { trackAgencyBrowserEvent, type AgencyAnalyticsCaptureResult, type AgencyAnalyticsEventInput } from "./analytics";

const resolveProperties = (
  value: Record<string, unknown> | (() => Record<string, unknown>) | undefined,
) => (typeof value === "function" ? value() : value ?? {});

const reportBrowserAnalyticsError = (error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("Agency analytics event failed.", error);
  }
};

export const useAgencyAnalytics = (options?: {
  defaultProperties?: Record<string, unknown> | (() => Record<string, unknown>);
  endpoint?: string;
}) => {
  const track = useEffectEvent(async (input: AgencyAnalyticsEventInput): Promise<AgencyAnalyticsCaptureResult> => {
    return await trackAgencyBrowserEvent(
      {
        ...input,
        properties: {
          ...resolveProperties(options?.defaultProperties),
          ...(input.properties ?? {}),
        },
      },
      { endpoint: options?.endpoint },
    );
  });

  return { track };
};

export const useAgencyPageView = (options?: {
  defaultProperties?: Record<string, unknown> | (() => Record<string, unknown>);
  endpoint?: string;
  eventName?: string;
}) => {
  const router = useRouter();
  const lastPathRef = useRef<string | null>(null);
  const { track } = useAgencyAnalytics({
    defaultProperties: options?.defaultProperties,
    endpoint: options?.endpoint,
  });

  useEffect(() => {
    if (!router.isReady || typeof document === "undefined") {
      return;
    }

    const path = router.asPath.trim();
    if (!path || lastPathRef.current === path) {
      return;
    }

    const previousPath = lastPathRef.current;
    lastPathRef.current = path;

    void track({
      name: options?.eventName ?? "page_viewed",
      properties: {
        path,
        route: router.route,
        previousPath,
        title: document.title || null,
        referrer: document.referrer || null,
      },
    }).catch(reportBrowserAnalyticsError);
  }, [router.asPath, router.isReady, router.route, track, options?.eventName]);
};

export const AgencyAnalyticsPageTracker = (options?: {
  defaultProperties?: Record<string, unknown> | (() => Record<string, unknown>);
  endpoint?: string;
  eventName?: string;
}) => {
  useAgencyPageView(options);
  return null;
};
