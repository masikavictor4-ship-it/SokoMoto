import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/passwordReset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Password reset token is missing.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a new password.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your new password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const result = await resetPassword(
      token,
      password
    );

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while resetting your password.",
      },
      { status: 500 }
    );
  }
}
