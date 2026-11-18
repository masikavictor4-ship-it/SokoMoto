import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profileImage: true,
      },
    });

    if (!dbUser || dbUser.status !== "ACTIVE") {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        profileImage: dbUser.profileImage,
      },
    });
  } catch (error) {
    console.error("ME API error:", error);

    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }
}
