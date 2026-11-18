import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const AT_USERNAME = process.env.AT_USERNAME || "sandbox";
const AT_API_KEY = process.env.AT_API_KEY;
const AT_ENV = process.env.AT_ENV || "sandbox";
const AT_SENDER_ID = process.env.AT_SENDER_ID;

function normalizePhone(phone: string): string {
  let value = phone.trim().replace(/\s+/g, "");

  if (value.startsWith("07")) {
    value = "+254" + value.substring(1);
  } else if (value.startsWith("7")) {
    value = "+254" + value;
  } else if (value.startsWith("254")) {
    value = "+" + value;
  }

  return value;
}

function hashToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

async function sendVerificationSMS(
  phone: string,
  code: string
) {
  if (!AT_API_KEY) {
    throw new Error("AT_API_KEY is not configured.");
  }

  const normalizedPhone = normalizePhone(phone);

  const message =
    `Your MarketPlace verification code is ${code}. ` +
    `It expires in 10 minutes.`;

  const apiUrl =
    AT_ENV === "production"
      ? "https://api.africastalking.com/version1/messaging"
      : "https://api.sandbox.africastalking.com/version1/messaging";

  const body = new URLSearchParams();

  body.append("username", AT_USERNAME);
  body.append("to", normalizedPhone);
  body.append("message", message);

  if (AT_SENDER_ID) {
    body.append("from", AT_SENDER_ID);
  }

  console.log("========== AFRICA'S TALKING SMS ==========");
  console.log("Environment:", AT_ENV);
  console.log("Username:", AT_USERNAME);
  console.log("Phone:", normalizedPhone);
  console.log(
    "Sender ID:",
    AT_SENDER_ID || "(not specified)"
  );
  console.log("==========================================");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type":
        "application/x-www-form-urlencoded",
      apiKey: AT_API_KEY,
    },
    body: body.toString(),
  });

  const responseText = await response.text();

  console.log(
    "Africa's Talking HTTP status:",
    response.status
  );

  console.log(
    "Africa's Talking response:",
    responseText
  );

  let smsResult: any;

  try {
    smsResult = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Africa's Talking returned an invalid response: ${responseText}`
    );
  }

  if (!response.ok) {
    throw new Error(
      smsResult?.SMSMessageData?.Message ||
        smsResult?.message ||
        `Africa's Talking SMS failed with HTTP ${response.status}`
    );
  }

  const recipients =
    smsResult?.SMSMessageData?.Recipients;

  if (
    !Array.isArray(recipients) ||
    recipients.length === 0
  ) {
    throw new Error(
      smsResult?.SMSMessageData?.Message ||
        "Africa's Talking did not return a recipient result."
    );
  }

  const failedRecipient = recipients.find(
    (recipient: any) =>
      String(recipient?.status || "").toLowerCase() !==
      "success"
  );

  if (failedRecipient) {
    throw new Error(
      failedRecipient?.status ||
        "Africa's Talking failed to send the SMS."
    );
  }

  console.log(
    "SMS VERIFICATION SENT SUCCESSFULLY"
  );

  console.log(
    "Message:",
    smsResult.SMSMessageData.Message
  );

  console.log(
    "Message ID:",
    recipients[0]?.messageId ||
      "(not provided)"
  );

  console.log(
    "Recipient:",
    recipients[0]?.number ||
      normalizedPhone
  );

  console.log(
    "Recipient status:",
    recipients[0]?.status
  );

  return {
    success: true,
    messageId:
      recipients[0]?.messageId || null,
    phone: normalizedPhone,
  };
}

/*
 * CREATE PHONE VERIFICATION TOKEN
 */
export async function createPhoneVerificationToken(
  userId: number,
  phone: string
) {
  const code = crypto
    .randomInt(100000, 1000000)
    .toString();

  /*
   * We never store the actual 6-digit code.
   * We store its SHA-256 hash in the database's
   * "token" column.
   */
  const tokenHash = hashToken(code);

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  /*
   * Delete old verification codes.
   */
  await prisma.phoneVerificationToken.deleteMany({
    where: {
      userId,
    },
  });

  /*
   * Store the hash in the migration-compatible
   * "token" database column.
   */
  await prisma.phoneVerificationToken.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
    },
  });

  /*
   * Send SMS.
   */
  const smsResult = await sendVerificationSMS(
    phone,
    code
  );

  return {
    success: true,
    phone: smsResult.phone,
    messageId: smsResult.messageId,
    expiresAt,
  };
}

/*
 * RESEND PHONE VERIFICATION CODE
 */
export async function resendPhoneVerificationCode(
  userId: number,
  phone: string
) {
  /*
   * Creates a completely new verification code
   * and invalidates the previous one.
   */
  return createPhoneVerificationToken(
    userId,
    phone
  );
}

/*
 * VERIFY PHONE CODE
 *
 * This is the function used by:
 * app/api/verify-phone/route.ts
 */
export async function verifyPhoneCode(
  userId: number,
  code: string
): Promise<boolean> {
  const tokenHash = hashToken(code.trim());

  const verificationToken =
    await prisma.phoneVerificationToken.findFirst({
      where: {
        userId,
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

  if (!verificationToken) {
    return false;
  }

  /*
   * Delete the token immediately so it cannot
   * be reused.
   */
  await prisma.phoneVerificationToken.delete({
    where: {
      id: verificationToken.id,
    },
  });

  /*
   * Mark the phone as verified.
   *
   * The database uses phoneVerifiedAt rather
   * than the old phoneVerified boolean.
   */
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      phoneVerifiedAt: new Date(),
    },
  });

  return true;
}

/*
 * Backwards-compatible export.
 *
 * Other existing code may still use the longer
 * function name.
 */
export async function verifyPhoneVerificationCode(
  userId: number,
  code: string
) {
  const success = await verifyPhoneCode(
    userId,
    code
  );

  if (!success) {
    return {
      success: false,
      error:
        "Invalid or expired verification code.",
    };
  }

  return {
    success: true,
  };
}
