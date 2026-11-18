import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account was found with that email." },
        { status: 404 }
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "This email address is already verified." },
        { status: 400 }
      );
    }

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId: user.id,
      },
    });

    const appUrl =
      process.env.APP_URL || "http://localhost:3000";

    const verificationUrl =
      `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl,
    });

    return NextResponse.json({
      message: "Verification email sent successfully.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return NextResponse.json(
      {
        error: "Unable to send the verification email.",
      },
      { status: 500 }
    );
  }
}
