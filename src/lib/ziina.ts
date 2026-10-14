import { createHmac, timingSafeEqual } from "crypto";
import { getPaymentReturnSiteUrl } from "@/lib/site-url";

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

export const ZIINA_WEBHOOK_IPS = [
  "3.29.184.186",
  "3.29.190.95",
  "20.233.47.127",
  "13.202.161.181",
] as const;

export type ZiinaPaymentIntentStatus =
  | "requires_payment_instrument"
  | "requires_user_action"
  | "pending"
  | "completed"
  | "failed"
  | "canceled";

export type ZiinaPaymentIntent = {
  id: string;
  amount: number;
  currency_code: string;
  status: ZiinaPaymentIntentStatus;
  operation_id: string;
  redirect_url?: string;
  message?: string;
};

export type CreateZiinaPaymentIntentInput = {
  amountAed: number;
  orderId: string;
  orderNumber: string;
  message?: string;
};

export function getZiinaConfig() {
  const accessToken = process.env.ZIINA_ACCESS_TOKEN?.trim() ?? "";
  const webhookSecret = process.env.ZIINA_WEBHOOK_SECRET?.trim() ?? "";
  const testMode =
    process.env.ZIINA_TEST_MODE === "true" ||
    process.env.ZIINA_TEST_MODE === "1";

  return {
    accessToken,
    webhookSecret,
    testMode,
    enabled: Boolean(accessToken),
  };
}

/** AED decimal amount → fils (base units). */
export function aedToFils(amountAed: number) {
  return Math.round(amountAed * 100);
}

export function filsToAed(fils: number) {
  return fils / 100;
}

export function verifyZiinaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
) {
  if (!secret || !signatureHeader) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.trim().toLowerCase();

  if (expected.length !== provided.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export async function createZiinaPaymentIntent(
  input: CreateZiinaPaymentIntentInput
): Promise<{ ok: true; intent: ZiinaPaymentIntent } | { ok: false; error: string }> {
  const config = getZiinaConfig();
  if (!config.enabled) {
    return { ok: false, error: "Ziina is not configured." };
  }

  const fils = aedToFils(input.amountAed);
  if (fils < 200) {
    return {
      ok: false,
      error: "Order total must be at least AED 2.00 to pay online with Ziina.",
    };
  }

  const siteUrl = await getPaymentReturnSiteUrl();
  const orderQuery = encodeURIComponent(input.orderNumber);
  const successUrl = `${siteUrl}/order-confirmation?order=${orderQuery}&payment_intent_id={PAYMENT_INTENT_ID}`;
  const cancelUrl = `${siteUrl}/order-confirmation?order=${orderQuery}&payment=cancelled`;
  const failureUrl = `${siteUrl}/order-confirmation?order=${orderQuery}&payment=failed`;

  const body: Record<string, unknown> = {
    amount: fils,
    currency_code: "AED",
    operation_id: input.orderId,
    message: input.message ?? `Order ${input.orderNumber}`,
    success_url: successUrl,
    cancel_url: cancelUrl,
    failure_url: failureUrl,
    allow_tips: false,
  };

  if (config.testMode) {
    body.test = true;
  }

  const response = await fetch(`${ZIINA_API_BASE}/payment_intent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ZiinaPaymentIntent
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      (payload && "error" in payload && payload.error) ||
      `Ziina API error (${response.status})`;
    return { ok: false, error: String(message) };
  }

  if (!payload || !("id" in payload) || !payload.redirect_url) {
    return { ok: false, error: "Ziina did not return a payment page URL." };
  }

  return { ok: true, intent: payload as ZiinaPaymentIntent };
}

export async function getZiinaPaymentIntent(
  paymentIntentId: string
): Promise<{ ok: true; intent: ZiinaPaymentIntent } | { ok: false; error: string }> {
  const config = getZiinaConfig();
  if (!config.enabled) {
    return { ok: false, error: "Ziina is not configured." };
  }

  const response = await fetch(
    `${ZIINA_API_BASE}/payment_intent/${encodeURIComponent(paymentIntentId)}`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | ZiinaPaymentIntent
    | { message?: string }
    | null;

  if (!response.ok || !payload || !("id" in payload)) {
    const message =
      (payload && "message" in payload && payload.message) ||
      `Could not load payment (${response.status})`;
    return { ok: false, error: String(message) };
  }

  return { ok: true, intent: payload };
}
