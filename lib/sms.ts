const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER_ID = process.env.AT_SENDER_ID;
const AT_ENV = process.env.AT_ENV || "sandbox";

const SMS_URL =
  AT_ENV === "production"
    ? "https://api.africastalking.com/version1/messaging"
    : "https://api.sandbox.africastalking.com/version1/messaging";

export function normalizeKenyanPhone(phone: string): string {
  const value = phone.trim().replace(/\s+/g, "");

  if (value.startsWith("+254")) {
    return value;
  }

  if (value.startsWith("254")) {
    return `+${value}`;
  }

  if (value.startsWith("07") || value.startsWith("01")) {
    return `+254${value.substring(1)}`;
  }

  throw new Error(
    "Invalid Kenyan phone number. Use 0712345678 or +254712345678."
  );
}

export async function sendSms(
  phone: string,
  message: string
): Promise<{
  success: boolean;
  response?: unknown;
  error?: string;
}> {
  try {
    if (!AT_USERNAME) {
      throw new Error("AT_USERNAME is not configured.");
    }

    if (!AT_API_KEY) {
      throw new Error("AT_API_KEY is not configured.");
    }

    const normalizedPhone = normalizeKenyanPhone(phone);

    const body = new URLSearchParams();

    body.append("username", AT_USERNAME);
    body.append("to", normalizedPhone);
    body.append("message", message);

    if (AT_SENDER_ID && AT_SENDER_ID.trim()) {
      body.append("from", AT_SENDER_ID.trim());
    }

    console.log("========== AFRICA'S TALKING SMS ==========");
    console.log("Environment:", AT_ENV);
    console.log("Username:", AT_USERNAME);
    console.log("Phone:", normalizedPhone);
    console.log("Sender ID:", AT_SENDER_ID || "(not specified)");
    console.log("==========================================");

    const response = await fetch(SMS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey: AT_API_KEY,
      },
      body: body.toString(),
    });

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log("Africa's Talking HTTP status:", response.status);

    console.log(
      "Africa's Talking response:",
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
      return {
        success: false,
        response: data,
        error: `SMS request failed with status ${response.status}.`,
      };
    }

    const smsData = data?.SMSMessageData;

    const providerMessage = smsData?.Message;

    const recipients = smsData?.Recipients;

    /*
     * Africa's Talking sandbox can return a message such as:
     *
     * "Sent to 1/1 Total Cost: KES 0.8000 Message parts: 1"
     *
     * This means the message was accepted.
     */

    if (
      typeof providerMessage === "string" &&
      /^Sent to \d+\/\d+/i.test(providerMessage)
    ) {
      console.log("SMS accepted by Africa's Talking.");

      return {
        success: true,
        response: data,
      };
    }

    /*
     * If recipients are returned, inspect their status.
     */
    if (Array.isArray(recipients) && recipients.length > 0) {
      const failedRecipient = recipients.find(
        (recipient: any) =>
          recipient?.status &&
          !["sent", "queued", "submitted", "success"].includes(
            String(recipient.status).toLowerCase()
          )
      );

      if (failedRecipient) {
        return {
          success: false,
          response: data,
          error:
            failedRecipient.status ||
            "Africa's Talking rejected the SMS.",
        };
      }

      console.log("SMS accepted by Africa's Talking.");

      return {
        success: true,
        response: data,
      };
    }

    /*
     * Provider returned HTTP 200 but did not give us
     * a recognizable successful response.
     */
    return {
      success: false,
      response: data,
      error:
        providerMessage ||
        "Africa's Talking did not return a recognizable SMS success response.",
    };
  } catch (error) {
    console.error("SMS sending error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown SMS sending error.",
    };
  }
}
