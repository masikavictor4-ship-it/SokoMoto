import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPasswordResetToken,
} from "@/lib/passwordReset";

const APP_URL =
  process.env.APP_URL || "http://localhost:3000";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your email address.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    /*
     * Always return the same response whether the account exists.
     * This prevents attackers from discovering registered emails.
     */
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    }

    const { rawToken } = await createPasswordResetToken(user.id);

    const resetUrl =
      `${APP_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");

      return NextResponse.json(
        {
          success: false,
          message:
            "Email service is not configured. Please contact the administrator.",
        },
        { status: 500 }
      );
    }

    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: [email],
          subject: "Reset your SokoMtaani password",
          html: `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,sans-serif;">
                <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;padding:35px;box-shadow:0 5px 25px rgba(0,0,0,0.08);">
                  
                  <h1 style="color:#16a34a;margin-top:0;">
                    SokoMtaani
                  </h1>

                  <h2>Password Reset Request</h2>

                  <p>
                    Hello ${escapeHtml(user.name)},
                  </p>

                  <p>
                    We received a request to reset your SokoMtaani password.
                  </p>

                  <p>
                    Click the button below to create a new password.
                  </p>

                  <div style="margin:30px 0;">
                    <a
                      href="${resetUrl}"
                      style="
                        display:inline-block;
                        padding:14px 24px;
                        background:#16a34a;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                        font-weight:bold;
                      "
                    >
                      Reset My Password
                    </a>
                  </div>

                  <p>
                    This link expires in <strong>30 minutes</strong>.
                  </p>

                  <p style="color:#666;font-size:14px;">
                    If you did not request a password reset, you can safely
                    ignore this email.
                  </p>

                  <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">

                  <p style="color:#888;font-size:12px;">
                    SokoMtaani security notification.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();

      console.error(
        "Resend password reset email failed:",
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "We could not send the password reset email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
