import { NextResponse } from "next/server";
import { verifyPhoneCode } from "@/lib/phoneVerification";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = Number(body.userId);

    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          error:
            "Enter the 6-digit verification code.",
        },
        { status: 400 }
      );
    }

    const verified = await verifyPhoneCode(
      userId,
      code
    );

    if (!verified) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Phone number verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(
      "Phone verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify phone number.",
      },
      { status: 500 }
    );
  }
}
