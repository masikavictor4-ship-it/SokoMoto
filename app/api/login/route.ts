
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("AUTH_SECRET is missing or invalid.");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Diagnostic information: never log passwords or password hashes.
    console.log("LOGIN ACCOUNT CHECK:", {
      email: user.email,
      status: user.status,
      phoneVerifiedAt: user.phoneVerifiedAt,
    });

    if (
      String(user.status).toUpperCase() !== "ACTIVE" ||
      !user.phoneVerifiedAt
    ) {
      return NextResponse.json(
        {
          success: false,
          message: !user.phoneVerifiedAt
            ? "Please verify your phone number before logging in."
            : "Account is not active.",
          phoneVerificationRequired: !user.phoneVerifiedAt,
        },
        { status: 403 }
      );
    }

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(secret));

    const destination =
      String(user.role).toUpperCase() === "ADMIN"
        ? "/admin"
        : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      redirect: destination,
      redirectTo: destination,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneVerified: true,
      },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete login.",
      },
      { status: 500 }
    );
  }
}
