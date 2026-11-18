import { NextResponse } from "next/server";

import {
  getAirtelAccessToken,
  getAirtelBaseUrl,
  getAirtelCountry,
  getAirtelCurrency,
} from "@/lib/airtel";

export async function GET() {
  try {
    const token =
      await getAirtelAccessToken();

    return NextResponse.json({
      success: true,

      environment:
        process.env.AIRTEL_ENV ||
        "sandbox",

      baseUrl:
        getAirtelBaseUrl(),

      country:
        getAirtelCountry(),

      currency:
        getAirtelCurrency(),

      tokenConfigured:
        Boolean(token),

      message:
        "Airtel authentication successful.",
    });
  } catch (error) {
    console.error(
      "Airtel auth test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Airtel authentication failed.",
      },
      { status: 500 }
    );
  }
}
