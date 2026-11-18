import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    environment: process.env.MPESA_ENV,
    consumerKeyLoaded:
      !!process.env.MPESA_CONSUMER_KEY,
    consumerSecretLoaded:
      !!process.env.MPESA_CONSUMER_SECRET,
    shortcodeLoaded:
      !!process.env.MPESA_SHORTCODE,
    passkeyLoaded:
      !!process.env.MPESA_PASSKEY,
    callbackLoaded:
      !!process.env.MPESA_CALLBACK_URL,
  });
}
