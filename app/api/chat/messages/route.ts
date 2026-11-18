import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/*
 * GET
 * Returns messages for a conversation.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the latest account status from the database.
    const currentUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 401 }
      );
    }

    if (
      currentUser.status === "INACTIVE" ||
      currentUser.status === "SUSPENDED" ||
      currentUser.status === "BLOCKED"
    ) {
      return NextResponse.json(
        { error: "Your account is not active." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required." },
        { status: 400 }
      );
    }

    const id = Number(conversationId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid conversationId." },
        { status: 400 }
      );
    }

    const conversation =
      await prisma.chatConversation.findUnique({
        where: {
          id,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    /*
     * Customers may only access their own conversation.
     * Admins may access any conversation.
     */
    if (
      currentUser.role !== "ADMIN" &&
      conversation.customerId !== currentUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have access to this conversation.",
        },
        { status: 403 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    /*
     * Mark messages sent by the other person as read.
     */
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: id,
        senderId: {
          not: currentUser.id,
        },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error("GET /api/chat/messages error:", error);

    return NextResponse.json(
      {
        error: "Failed to load chat messages.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 * Sends a new chat message.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the latest account status from the database.
    const currentUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 401 }
      );
    }

    if (
      currentUser.status === "INACTIVE" ||
      currentUser.status === "SUSPENDED" ||
      currentUser.status === "BLOCKED"
    ) {
      return NextResponse.json(
        { error: "Your account is not active." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const conversationId =
      body?.conversationId !== undefined
        ? Number(body.conversationId)
        : null;

    const content =
      typeof body?.content === "string"
        ? body.content.trim()
        : "";

    if (
      !conversationId ||
      !Number.isInteger(conversationId)
    ) {
      return NextResponse.json(
        {
          error: "Valid conversationId is required.",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          error: "Message cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        {
          error: "Message cannot exceed 2000 characters.",
        },
        { status: 400 }
      );
    }

    const conversation =
      await prisma.chatConversation.findUnique({
        where: {
          id: conversationId,
        },
      });

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Customers can only send messages in their own
     * conversation.
     *
     * Admins can send messages in any conversation.
     */
    if (
      currentUser.role !== "ADMIN" &&
      conversation.customerId !== currentUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to send messages in this conversation.",
        },
        { status: 403 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        conversationId,
        senderId: currentUser.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    /*
     * Update conversation timestamp so the newest
     * conversations appear first in the admin chat.
     */
    await prisma.chatConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chat/messages error:", error);

    return NextResponse.json(
      {
        error: "Failed to send chat message.",
      },
      { status: 500 }
    );
  }
}
