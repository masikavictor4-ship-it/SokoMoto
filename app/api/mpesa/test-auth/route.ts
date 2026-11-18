import { NextResponse } from "next/server";
import { getMpesaAccessToken } from "@/lib/mpesa";

export async function GET() {
  try {
    await getMpesaAccessToken();

    return NextResponse.json({
      success: true,
      message: "M-Pesa Consumer Key and Consumer Secret are accepted.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "M-Pesa authentication failed.",
      },
      { status: 500 }
    );
  }
}
