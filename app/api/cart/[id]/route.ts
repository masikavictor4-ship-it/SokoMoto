import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const cartItemId = Number(id);

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Invalid cart item." },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId: user.id,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found." },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return NextResponse.json({
      message: "Item removed from cart.",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    return NextResponse.json(
      { error: "Failed to remove cart item." },
      { status: 500 }
    );
  }
}
