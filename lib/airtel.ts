import crypto from "crypto";

type AirtelEnvironment = "sandbox" | "production";

type AirtelTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type AirtelPaymentResponse = {
  status?: {
    code?: string;
    message?: string;
    response_code?: string;
    success?: boolean;
  };

  data?: {
    transaction?: {
      id?: string;
      status?: string;
      statusCode?: string;
      message?: string;
      reference?: string;
      airtel_money_id?: string;
    };
  };

  error?: unknown;
};

type AirtelStatusResponse = AirtelPaymentResponse;

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

function getEnvironment(): AirtelEnvironment {
  return process.env.AIRTEL_ENV === "production"
    ? "production"
    : "sandbox";
}

export function getAirtelBaseUrl(): string {
  return getEnvironment() === "production"
    ? "https://openapi.airtel.africa"
    : "https://openapiuat.airtel.africa";
}

function getClientId(): string {
  const value = process.env.AIRTEL_CLIENT_ID;

  if (!value) {
    throw new Error(
      "AIRTEL_CLIENT_ID is not configured."
    );
  }

  return value;
}

function getClientSecret(): string {
  const value = process.env.AIRTEL_CLIENT_SECRET;

  if (!value) {
    throw new Error(
      "AIRTEL_CLIENT_SECRET is not configured."
    );
  }

  return value;
}

export function getAirtelCountry(): string {
  return (
    process.env.AIRTEL_COUNTRY || "KE"
  ).toUpperCase();
}

export function getAirtelCurrency(): string {
  return (
    process.env.AIRTEL_CURRENCY || "KES"
  ).toUpperCase();
}

export function getAirtelApiVersion(): string {
  return (
    process.env.AIRTEL_API_VERSION || "v2"
  ).toLowerCase();
}

/**
 * Convert Kenyan phone numbers into Airtel's
 * international format without +.
 *
 * Examples:
 *
 * 0712345678 -> 254712345678
 * 0112345678 -> 254112345678
 * +254712345678 -> 254712345678
 * 254712345678 -> 254712345678
 */
export function normalizeAirtelPhone(
  phone: string
): string {
  const value = phone
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .trim();

  if (value.startsWith("+254")) {
    return value.substring(1);
  }

  if (value.startsWith("254")) {
    return value;
  }

  if (
    value.startsWith("07") ||
    value.startsWith("01")
  ) {
    return `254${value.substring(1)}`;
  }

  return value;
}

export function isValidAirtelPhone(
  phone: string
): boolean {
  return /^254(7|1)\d{8}$/.test(phone);
}

/**
 * Airtel OAuth 2.0 client credentials.
 */
export async function getAirtelAccessToken(): Promise<string> {
  const now = Date.now();

  /*
   * Reuse the token until shortly before expiry.
   */
  if (
    cachedToken &&
    cachedTokenExpiry > now + 60_000
  ) {
    return cachedToken;
  }

  const response = await fetch(
    `${getAirtelBaseUrl()}/auth/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as AirtelTokenResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    console.error(
      "Airtel authentication failed:",
      {
        status: response.status,
        data,
      }
    );

    throw new Error(
      data.error_description ||
        data.error ||
        `Airtel authentication failed with HTTP ${response.status}.`
    );
  }

  const expiresIn =
    Number(data.expires_in) || 3600;

  cachedToken = data.access_token;

  /*
   * Keep a safety margin before actual expiration.
   */
  cachedTokenExpiry =
    Date.now() +
    Math.max(
      60_000,
      (expiresIn - 60) * 1000
    );

  return cachedToken;
}

/**
 * Create a unique transaction reference.
 */
export function createAirtelReference(
  orderId: number
): string {
  const random = crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

  return `MP-${orderId}-${Date.now()}-${random}`;
}

/**
 * Initiate an Airtel Money collection.
 */
export async function initiateAirtelCollection(
  params: {
    orderId: number;
    phoneNumber: string;
    amount: number;
    reference: string;
  }
): Promise<AirtelPaymentResponse> {
  const token =
    await getAirtelAccessToken();

  const country =
    getAirtelCountry();

  const currency =
    getAirtelCurrency();

  const apiVersion =
    getAirtelApiVersion();

  const phone =
    normalizeAirtelPhone(
      params.phoneNumber
    );

  if (!isValidAirtelPhone(phone)) {
    throw new Error(
      "Enter a valid Kenyan Airtel Money number, for example 0712345678."
    );
  }

  if (
    !Number.isFinite(params.amount) ||
    params.amount <= 0
  ) {
    throw new Error(
      "Invalid payment amount."
    );
  }

  const amount = Math.round(
    params.amount
  );

  /*
   * Airtel's current collection documentation
   * uses the following structure.
   */
  const payload = {
    reference: params.reference,

    subscriber: {
      country,
      currency,
      msisdn: phone,
    },

    transaction: {
      amount: String(amount),
      country,
      currency,
      id: params.reference,
      type: "MerchantPayment",
    },
  };

  /*
   * Keep the endpoint configurable because Airtel
   * applications can expose different API versions.
   */
  const endpoint =
    apiVersion === "v1"
      ? "/merchant/v1/payments/"
      : `/merchant/v2/payments/${country}`;

  console.log(
    "========== AIRTEL MONEY COLLECTION =========="
  );

  console.log(
    "Environment:",
    getEnvironment()
  );

  console.log(
    "Country:",
    country
  );

  console.log(
    "Currency:",
    currency
  );

  console.log(
    "API version:",
    apiVersion
  );

  console.log(
    "Phone:",
    phone
  );

  console.log(
    "Amount:",
    amount
  );

  console.log(
    "Reference:",
    params.reference
  );

  console.log(
    "Endpoint:",
    `${getAirtelBaseUrl()}${endpoint}`
  );

  console.log(
    "=============================================");

  const response = await fetch(
    `${getAirtelBaseUrl()}${endpoint}`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Country": country,
        "X-Currency": currency,
      },

      body: JSON.stringify(payload),

      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as AirtelPaymentResponse;

  console.log(
    "========== AIRTEL RESPONSE =========="
  );

  console.log(
    JSON.stringify(
      data,
      null,
      2
    )
  );

  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "======================================");

  if (!response.ok) {
    throw new Error(
      extractAirtelError(
        data
      ) ||
        `Airtel payment request failed with HTTP ${response.status}.`
    );
  }

  return data;
}

/**
 * Query Airtel transaction status.
 */
export async function getAirtelTransactionStatus(
  transactionId: string
): Promise<AirtelStatusResponse> {
  const token =
    await getAirtelAccessToken();

  const country =
    getAirtelCountry();

  const currency =
    getAirtelCurrency();

  /*
   * Airtel's status API is commonly exposed
   * through /standard/v1/payments/{transactionId}.
   */
  const endpoint =
    `/standard/v1/payments/${encodeURIComponent(
      transactionId
    )}`;

  const response = await fetch(
    `${getAirtelBaseUrl()}${endpoint}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Country": country,
        "X-Currency": currency,
      },

      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as AirtelStatusResponse;

  console.log(
    "Airtel transaction status:",
    JSON.stringify(
      data,
      null,
      2
    )
  );

  if (!response.ok) {
    throw new Error(
      extractAirtelError(data) ||
        `Airtel status request failed with HTTP ${response.status}.`
    );
  }

  return data;
}

/**
 * Extract a useful error from Airtel responses.
 */
export function extractAirtelError(
  data: unknown
): string | null {
  if (!data) {
    return null;
  }

  const value =
    data as AirtelPaymentResponse;

  if (
    value.status?.message
  ) {
    return value.status.message;
  }

  if (
    value.data?.transaction?.message
  ) {
    return value.data.transaction.message;
  }

  if (
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return null;
}

/**
 * Interpret common Airtel successful statuses.
 */
export function isAirtelSuccessfulStatus(
  status: unknown,
  statusCode?: unknown
): boolean {
  const normalized =
    String(status ?? "")
      .trim()
      .toLowerCase();

  const code =
    String(statusCode ?? "")
      .trim()
      .toUpperCase();

  return (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "completed" ||
    normalized === "paid" ||
    code === "00"
  );
}

/**
 * Interpret common Airtel failed statuses.
 */
export function isAirtelFailedStatus(
  status: unknown,
  statusCode?: unknown
): boolean {
  const normalized =
    String(status ?? "")
      .trim()
      .toLowerCase();

  const code =
    String(statusCode ?? "")
      .trim()
      .toUpperCase();

  return (
    normalized === "failed" ||
    normalized === "failure" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "rejected" ||
    normalized === "expired" ||
    code === "TF"
  );
}
