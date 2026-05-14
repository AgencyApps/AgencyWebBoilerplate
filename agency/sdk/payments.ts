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

export type AgencyBillingPrice = {
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
};

export type AgencyBillingProduct = {
  id: string;
  providerProductId: string;
  catalogKey: string | null;
  name: string;
  description: string | null;
  active: boolean;
  defaultPriceId: string | null;
  prices: AgencyBillingPrice[];
  createdAt: string;
  updatedAt: string;
};

export type AgencyBillingCatalog = {
  appId: string;
  products: AgencyBillingProduct[];
};

export type AgencyBillingCheckout = {
  id: string;
  providerCheckoutId: string;
  providerPaymentIntentId: string | null;
  providerSubscriptionId: string | null;
  mode: "payment" | "subscription";
  status: "open" | "complete" | "expired";
  paymentStatus: string;
  checkoutUrl: string | null;
  customerEmail: string | null;
  customerName: string | null;
  currency: string | null;
  amountTotal: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type AgencyBillingPayment = {
  id: string;
  providerPaymentId: string;
  providerChargeId: string | null;
  checkoutId: string | null;
  status: string;
  currency: string;
  amount: number;
  feeAmount: number | null;
  netAmount: number | null;
  refundedAmount: number;
  availableAt: string | null;
  customerEmail: string | null;
  customerName: string | null;
  description: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgencyBillingRefund = {
  id: string;
  providerRefundId: string;
  paymentId: string | null;
  status: string;
  currency: string;
  amount: number;
  reason: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgencyBillingSubscription = {
  id: string;
  providerSubscriptionId: string;
  checkoutId: string | null;
  status: string;
  currency: string | null;
  interval: string | null;
  intervalCount: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgencyBillingRawStripeEvent = {
  id: string;
  stripeEventId: string;
  type: string;
  livemode: boolean;
  receivedAt: string;
  processedAt: string | null;
  processingError: string | null;
};

export type AgencyBillingEventType =
  | "billing.checkout.created"
  | "billing.checkout.completed"
  | "billing.checkout.expired"
  | "billing.payment.processing"
  | "billing.payment.succeeded"
  | "billing.payment.failed"
  | "billing.payment.canceled"
  | "billing.refund.created"
  | "billing.refund.updated"
  | "billing.subscription.updated"
  | (string & {});

export type AgencyBillingEvent = {
  id: string;
  type: AgencyBillingEventType;
  source: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type AgencyBillingEventFeed = {
  appId: string;
  events: AgencyBillingEvent[];
};

export type AgencyBillingDashboard = {
  merchantOfRecord: "agency-master-entity";
  subEntityId: string;
  summary: {
    grossSales: number;
    refunded: number;
    processingFees: number;
    netVolume: number;
    settledNet: number;
    pendingNet: number;
    currency: string;
  };
  catalog: AgencyBillingCatalog;
  checkouts: AgencyBillingCheckout[];
  payments: AgencyBillingPayment[];
  refunds: AgencyBillingRefund[];
  subscriptions: AgencyBillingSubscription[];
  revenueSeries: Array<{
    date: string;
    grossSales: number;
    refunds: number;
    netRevenue: number;
  }>;
  rawEvents: AgencyBillingRawStripeEvent[];
  normalizedEvents: AgencyBillingEvent[];
};

export type AgencyBillingCheckoutResult = {
  checkoutId: string;
  checkoutSessionId: string;
  checkoutUrl: string;
  merchantOfRecord: "agency-master-entity";
  subEntityId: string;
};

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

export type AgencyPaymentsCatalogProductInput = {
  catalogKey: string;
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, string | number | boolean>;
  prices: AgencyPaymentsPriceInput[];
};

export type AgencyPaymentsCatalogProductResult = {
  product: AgencyBillingProduct;
  defaultPrice: AgencyBillingPrice;
  created: boolean;
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
  await paymentsFetch<AgencyBillingCatalog>(`/products?appId=${encodeURIComponent(requireEnv("AGENCY_PAYMENTS_APP_ID"))}`);

export const createAgencyProduct = async (input: AgencyPaymentsProductInput) =>
  await paymentsFetch<{ product: AgencyBillingProduct }>("/products", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const upsertAgencyProduct = async (input: AgencyPaymentsCatalogProductInput) =>
  await paymentsFetch<AgencyPaymentsCatalogProductResult>("/products/upsert", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const createAgencyPrice = async (input: AgencyPaymentsPriceInput & { productId: string }) =>
  await paymentsFetch<{ price: AgencyBillingPrice }>("/prices", {
    method: "POST",
    body: JSON.stringify({
      appId: requireEnv("AGENCY_PAYMENTS_APP_ID"),
      ...input,
    }),
  });

export const createAgencyCheckout = async (input: AgencyPaymentsCheckoutInput) =>
  await paymentsFetch<AgencyBillingCheckoutResult>("/checkout", {
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
  await paymentsFetch<AgencyBillingDashboard>(
    `/dashboard?appId=${encodeURIComponent(requireEnv("AGENCY_PAYMENTS_APP_ID"))}&rangeDays=${encodeURIComponent(String(rangeDays))}`,
  );

export const listAgencyPaymentEvents = async (limit = 50) =>
  await paymentsFetch<AgencyBillingEventFeed>(
    `/events?appId=${encodeURIComponent(requireEnv("AGENCY_PAYMENTS_APP_ID"))}&limit=${encodeURIComponent(String(limit))}`,
  );
