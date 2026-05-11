const requireServer = () => {
  if (typeof window !== "undefined") {
    throw new Error("Agency payments SDK helpers are server-only.");
  }
};

const requireEnv = (name: "AGENCY_PAYMENTS_BASE_URL" | "AGENCY_PAYMENTS_APP_ID" | "AGENCY_PAYMENTS_ACCESS_TOKEN") => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

const getBaseUrl = () => {
  const value = requireEnv("AGENCY_PAYMENTS_BASE_URL");
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const buildPaymentsHeaders = () => ({
  authorization: `Bearer ${requireEnv("AGENCY_PAYMENTS_ACCESS_TOKEN")}`,
  "content-type": "application/json",
});

const paymentsFetch = async <T>(path: string, init?: RequestInit) => {
  requireServer();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...buildPaymentsHeaders(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Agency payments request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

export const getAgencyPaymentsConfig = () => ({
  baseUrl: getBaseUrl(),
  appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
});

export const initializeAgencyPaymentsIntegration = async () =>
  await paymentsFetch<{
    accepted: true;
    eventId: string;
    eventType: string;
    initializedAt: string;
    reused: boolean;
  }>("/initialize", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
    }),
  });

export type AgencyPaymentsPriceInput = {
  unitAmount: number;
  currency: string;
  type?: "one_time" | "recurring";
  interval?: "day" | "week" | "month" | "year";
  intervalCount?: number;
  nickname?: string;
  active?: boolean;
};

export type AgencyPaymentsProductInput = {
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, string | number | boolean>;
  prices?: AgencyPaymentsPriceInput[];
};

export type AgencyPaymentsCheckoutLineItem = {
  priceId?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitAmount?: number;
  currency?: string;
  interval?: "day" | "week" | "month" | "year";
  intervalCount?: number;
};

export type AgencyPaymentsCheckoutInput = {
  successUrl: string;
  cancelUrl: string;
  mode?: "payment" | "subscription";
  lineItems: AgencyPaymentsCheckoutLineItem[];
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string | number | boolean>;
};

export const listAgencyProducts = async () =>
  await paymentsFetch<{
    appId: string;
    products: Array<{
      id: string;
      providerProductId: string;
      name: string;
      description: string | null;
      active: boolean;
      defaultPriceId: string | null;
      prices: Array<{
        id: string;
        providerPriceId: string;
        productId: string | null;
        active: boolean;
        type: "one_time" | "recurring";
        currency: string;
        unitAmount: number;
        interval: string | null;
        intervalCount: number | null;
        nickname: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }>;
  }>(`/products?appId=${encodeURIComponent(requireEnv("AGENCY_PAYMENTS_APP_ID"))}`);

export const createAgencyProduct = async (input: AgencyPaymentsProductInput) =>
  await paymentsFetch<{ product: unknown }>("/products", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const createAgencyPrice = async (input: AgencyPaymentsPriceInput & { productId: string }) =>
  await paymentsFetch<{ price: unknown }>("/prices", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const createAgencyCheckout = async (input: AgencyPaymentsCheckoutInput) =>
  await paymentsFetch<{
    checkoutId: string;
    checkoutSessionId: string;
    checkoutUrl: string;
    merchantOfRecord: string;
    subEntityId: string;
  }>("/checkout", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const createAgencyRefund = async (input: { paymentId: string; amount?: number; reason?: "duplicate" | "fraudulent" | "requested_by_customer" }) =>
  await paymentsFetch<{ refundId: string; status: string }>("/refund", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const getAgencyBillingDashboard = async (rangeDays = 30) =>
  await paymentsFetch<unknown>(`/dashboard?appId=${encodeURIComponent(requireEnv("AGENCY_PAYMENTS_APP_ID"))}&rangeDays=${encodeURIComponent(String(rangeDays))}`);
