import { NextResponse } from "next/server";
import {
  resendPhoneVerificationCode,
} from "@/lib/phoneVerification";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = Number(body.userId);

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error: "Phone number is required.",
        },
        { status: 400 }
      );
    }

    await resendPhoneVerificationCode(
      userId,
      phone
    );

    return NextResponse.json({
      success: true,
      message:
        "A new verification code has been sent.",
    });
  } catch (error) {
    console.error(
      "Resend phone verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to resend verification code.",
      },
      { status: 500 }
    );
  }
}
