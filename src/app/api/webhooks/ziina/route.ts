import { NextResponse } from "next/server";
import {
  getZiinaConfig,
  verifyZiinaWebhookSignature,
  ZIINA_WEBHOOK_IPS,
  type ZiinaPaymentIntent,
} from "@/lib/ziina";
import { syncOrderFromZiinaIntent } from "@/lib/ziina-orders";

type ZiinaWebhookBody = {
  event?: string;
  data?: ZiinaPaymentIntent;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const config = getZiinaConfig();

  if (config.webhookSecret) {
    const signature = request.headers.get("x-hmac-signature");
    if (!verifyZiinaWebhookSignature(rawBody, signature, config.webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  if (process.env.NODE_ENV === "production") {
    const ip = getClientIp(request);
    if (ip && !ZIINA_WEBHOOK_IPS.includes(ip as (typeof ZIINA_WEBHOOK_IPS)[number])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let payload: ZiinaWebhookBody;
  try {
    payload = JSON.parse(rawBody) as ZiinaWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "payment_intent.status.updated" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  await syncOrderFromZiinaIntent(payload.data);

  return NextResponse.json({ received: true });
}
