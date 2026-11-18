import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        createdAt: true,
        deliveryAddress: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        currentLatitude: true,
        currentLongitude: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = order.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You cannot access this order" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      order,
    });
  } catch (error) {
    console.error(
      "GET /api/orders/[id]/tracking error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load order tracking" },
      { status: 500 }
    );
  }
}
