import { useCallback, useEffect, useState } from "react";
import type { AgencyAuthSession } from "./auth";

type AgencyAuthClientState = {
  authenticated: boolean;
  error: string | null;
  isLoading: boolean;
  session: AgencyAuthSession | null;
};

type AgencyAuthSessionResponse = {
  authenticated: boolean;
  error?: string;
  session: AgencyAuthSession | null;
};

const EMPTY_STATE: AgencyAuthClientState = {
  authenticated: false,
  error: null,
  isLoading: true,
  session: null,
};

const getCurrentReturnPath = () => {
  if (typeof window === "undefined") {
    return "/";
  }
  return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
};

export const useAgencyAuth = () => {
  const [state, setState] = useState<AgencyAuthClientState>(EMPTY_STATE);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, error: null, isLoading: true }));
    try {
      const response = await fetch("/api/agency/auth/session", {
        credentials: "same-origin",
        method: "GET",
      });
      const payload = (await response.json()) as AgencyAuthSessionResponse;
      setState({
        authenticated: Boolean(response.ok && payload.authenticated && payload.session),
        error: response.ok ? null : (payload.error ?? "Agency auth session lookup failed."),
        isLoading: false,
        session: response.ok ? payload.session : null,
      });
    } catch (error) {
      setState({
        authenticated: false,
        error: error instanceof Error ? error.message : "Agency auth session lookup failed.",
        isLoading: false,
        session: null,
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback((next = getCurrentReturnPath()) => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.assign(`/api/agency/auth/start?next=${encodeURIComponent(next)}`);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/agency/auth/sign-out", {
      credentials: "same-origin",
      method: "POST",
    });
    setState({
      authenticated: false,
      error: null,
      isLoading: false,
      session: null,
    });
  }, []);

  return {
    ...state,
    accounts: state.session?.accounts ?? [],
    refresh,
    signIn,
    signOut,
    user: state.session?.user ?? null,
  };
};
