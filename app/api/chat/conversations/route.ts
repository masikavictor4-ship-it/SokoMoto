import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (user.role === "ADMIN") {
      const conversations = await prisma.chatConversation.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
              readAt: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return NextResponse.json({
        conversations,
      });
    }

    let conversation = await prisma.chatConversation.findUnique({
      where: {
        customerId: user.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          customerId: user.id,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      conversation,
    });
  } catch (error) {
    console.error("CHAT CONVERSATION ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load chat." },
      { status: 500 }
    );
  }
}
