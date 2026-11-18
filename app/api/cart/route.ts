import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireUser(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to view your cart." },
      { status: 401 }
    );
  }

  const items = await prisma.cartItem.findMany({
    where: {
      userId: user.id,
    },
    include: {
      product: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Please log in before adding products to your cart." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const productId = Number(body.productId);
  const quantity = Number(body.quantity || 1);

  if (!productId || quantity < 1) {
    return NextResponse.json(
      { error: "Invalid product or quantity." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Product not found." },
      { status: 404 }
    );
  }

  if (product.stock < quantity) {
    return NextResponse.json(
      { error: "Not enough stock available." },
      { status: 400 }
    );
  }

  const existing = await prisma.cartItem.findFirst({
    where: {
      userId: user.id,
      productId,
    },
  });

  if (existing) {
    const newQuantity = existing.quantity + quantity;

    if (newQuantity > product.stock) {
      return NextResponse.json(
        { error: "You cannot add more than the available stock." },
        { status: 400 }
      );
    }

    const item = await prisma.cartItem.update({
      where: {
        id: existing.id,
      },
      data: {
        quantity: newQuantity,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(item);
  }

  const item = await prisma.cartItem.create({
    data: {
      userId: user.id,
      productId,
      quantity,
    },
    include: {
      product: true,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Please log in first." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const id = Number(body.id);
  const quantity = Number(body.quantity);

  if (!id || quantity < 1) {
    return NextResponse.json(
      { error: "Invalid cart item or quantity." },
      { status: 400 }
    );
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      product: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Cart item not found." },
      { status: 404 }
    );
  }

  if (quantity > item.product.stock) {
    return NextResponse.json(
      { error: "Quantity exceeds available stock." },
      { status: 400 }
    );
  }

  const updated = await prisma.cartItem.update({
    where: {
      id,
    },
    data: {
      quantity,
    },
    include: {
      product: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Please log in first." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const id = Number(body.id);

  if (!id) {
    return NextResponse.json(
      { error: "Invalid cart item." },
      { status: 400 }
    );
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Cart item not found." },
      { status: 404 }
    );
  }

  await prisma.cartItem.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    message: "Item removed from cart.",
  });
}
