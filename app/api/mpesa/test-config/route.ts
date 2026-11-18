import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    environment: process.env.MPESA_ENV,
    shortcode: process.env.MPESA_SHORTCODE,
    consumerKeyLoaded: Boolean(process.env.MPESA_CONSUMER_KEY),
    consumerSecretLoaded: Boolean(process.env.MPESA_CONSUMER_SECRET),
    passkeyLoaded: Boolean(process.env.MPESA_PASSKEY),
    callbackUrl: process.env.MPESA_CALLBACK_URL,
  });
}
