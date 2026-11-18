import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: number) {
  // Remove any previous reset tokens for this user.
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);

  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const tokenHash = hashPasswordResetToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!resetToken) {
    return {
      success: false,
      message: "Invalid or expired password reset link.",
    };
  }

  if (resetToken.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });

    return {
      success: false,
      message:
        "This password reset link has expired. Please request a new one.",
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    }),

    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    }),
  ]);

  return {
    success: true,
    message: "Your password has been reset successfully.",
  };
}
