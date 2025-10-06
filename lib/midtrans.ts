import crypto from "crypto";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_BASE_URL = isProduction
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

export type SnapItemDetail = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

export type SnapTransactionPayload = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    billing_address?: Record<string, unknown>;
    shipping_address?: Record<string, unknown>;
  };
  item_details?: SnapItemDetail[];
  callbacks?: {
    finish?: string;
  };
};

export type SnapTransactionResponse = {
  token: string;
  redirect_url: string;
};

function getServerKey() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }
  return serverKey;
}

export async function createMidtransTransaction(
  payload: SnapTransactionPayload,
): Promise<SnapTransactionResponse> {
  const serverKey = getServerKey();
  const auth = Buffer.from(`${serverKey}:`).toString("base64");

  const res = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Midtrans error ${res.status}: ${errorBody}`);
  }

  const data = (await res.json()) as SnapTransactionResponse;
  if (!data?.token || !data?.redirect_url) {
    throw new Error("Invalid Midtrans response");
  }
  return data;
}

export function verifyMidtransSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  try {
    const serverKey = getServerKey();
    const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const digest = crypto.createHash("sha512").update(payload).digest("hex");
    return digest === signatureKey;
  } catch (err) {
    console.error("verifyMidtransSignature", err);
    return false;
  }
}

export function getMidtransSnapScriptUrl() {
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}
