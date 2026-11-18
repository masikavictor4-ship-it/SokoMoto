import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          error: "Verification token is missing.",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const verificationToken =
      await prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (!verificationToken) {
      return NextResponse.json(
        {
          error:
            "This verification link is invalid or has already been used.",
        },
        { status: 400 }
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: verificationToken.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "This verification link has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerifiedAt: new Date(),
        },
      }),

      prisma.emailVerificationToken.deleteMany({
        where: {
          userId: verificationToken.userId,
        },
      }),
    ]);

    return NextResponse.json({
      message:
        "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while verifying your email.",
      },
      { status: 500 }
    );
  }
}
