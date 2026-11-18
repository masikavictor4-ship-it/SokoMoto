import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

async function createSession(user: {
  id: number;
  name: string;
  email: string;
  role: string;
}) {
  const token = await new SignJWT({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        profileImage: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      status: account.status,
      emailVerified: Boolean(account.emailVerifiedAt),
      profileImage: account.profileImage,
      createdAt: account.createdAt,
      orderCount: account._count.orders,
    });
  } catch (error) {
    console.error("Account GET error:", error);

    return NextResponse.json(
      { error: "Failed to load account." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (currentUser.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is not active." },
        { status: 403 }
      );
    }

    if (action === "name") {
      const name = String(body.name || "").trim();

      if (name.length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters." },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { name },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      await createSession(updatedUser);

      return NextResponse.json({
        message: "Name updated successfully.",
        user: updatedUser,
      });
    }

    if (action === "password") {
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Current password and new password are required." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }

      const passwordMatches = await bcrypt.compare(
        currentPassword,
        currentUser.password
      );

      if (!passwordMatches) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      const cookieStore = await cookies();
      cookieStore.delete("session");

      return NextResponse.json({
        message: "Password changed successfully. Please log in again.",
      });
    }

    if (action === "deactivate") {
      const password = String(body.password || "");

      if (!password) {
        return NextResponse.json(
          { error: "Password is required." },
          { status: 400 }
        );
      }

      const passwordMatches = await bcrypt.compare(
        password,
        currentUser.password
      );

      if (!passwordMatches) {
        return NextResponse.json(
          { error: "Password is incorrect." },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { status: "DEACTIVATED" },
      });

      const cookieStore = await cookies();
      cookieStore.delete("session");

      return NextResponse.json({
        message: "Your account has been deactivated.",
      });
    }

    return NextResponse.json(
      { error: "Invalid account action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Account PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update account." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const password = String(body.password || "");

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      currentUser.password
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Password is incorrect." },
        { status: 400 }
      );
    }

    if (currentUser._count.orders > 0) {
      return NextResponse.json(
        {
          error:
            "Your account cannot be permanently deleted because you have existing orders.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      await tx.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      await tx.user.delete({
        where: { id: user.id },
      });
    });

    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.json({
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("Account DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    );
  }
}
