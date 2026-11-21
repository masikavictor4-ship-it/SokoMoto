
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createPhoneVerificationToken } from "@/lib/phoneVerification";
import { normalizeKenyanPhone } from "@/lib/sms";

export const runtime = "nodejs";

const MAX_ACCOUNTS_PER_PHONE = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        {
          error: "Name, email, phone number and password are required.",
        },
        { status: 400 }
      );
    }

    // Validate name
    if (name.length < 2) {
      return NextResponse.json(
        {
          error: "Name must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    // Normalize Kenyan phone number
    let normalizedPhone: string;

    try {
      normalizedPhone = normalizeKenyanPhone(phone);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid Kenyan phone number. Use 0712345678 or +254712345678.",
        },
        { status: 400 }
      );
    }

    // Check whether email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Count all accounts using this phone number
    const phoneAccountCount = await prisma.user.count({
      where: {
        phone: normalizedPhone,
      },
    });

    // Maximum 10 accounts per phone number
    if (phoneAccountCount >= MAX_ACCOUNTS_PER_PHONE) {
      return NextResponse.json(
        {
          error:
            "This phone number has reached its maximum limit of 10 accounts. Please use another phone number.",
          code: "PHONE_ACCOUNT_LIMIT_REACHED",
          maximumAccounts: MAX_ACCOUNTS_PER_PHONE,
          existingAccounts: phoneAccountCount,
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer account
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CUSTOMER",
        status: "ACTIVE",
        phone: normalizedPhone,
      },
    });

    /*
     * PHONE VERIFICATION
     * Every account receives its own verification code.
     */
    try {
      await createPhoneVerificationToken(
        user.id,
        normalizedPhone
      );

      console.log(
        `Phone verification SMS sent to ${normalizedPhone}`
      );
    } catch (smsError) {
      console.error(
        "Phone verification SMS failed:",
        smsError
      );

      // Delete account if required SMS cannot be sent
      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      return NextResponse.json(
        {
          error:
            smsError instanceof Error
              ? smsError.message
              : "Unable to send verification SMS.",
        },
        { status: 502 }
      );
    }

    /*
     * EMAIL VERIFICATION
     * Email verification remains optional.
     */
    try {
      const rawToken = crypto
        .randomBytes(32)
        .toString("hex");

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

      console.log(
        `Verification email sent to ${user.email}`
      );
    } catch (emailError) {
      console.error(
        "Optional verification email could not be sent:",
        emailError
      );
    }

    // Successful registration response
    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully. A verification code has been sent to your phone.",
        phoneVerificationRequired: true,
        maximumAccountsPerPhone: MAX_ACCOUNTS_PER_PHONE,
        existingAccountsOnPhone: phoneAccountCount + 1,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          phoneVerified: false,
          emailVerified: !!user.emailVerifiedAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}
