import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
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

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
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

    const body = await request.json();

    const {
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      currentLatitude,
      currentLongitude,
    } = body;

    const parseCoordinate = (
      value: unknown,
      name: string,
      min: number,
      max: number
    ) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const number = Number(value);

      if (
        !Number.isFinite(number) ||
        number < min ||
        number > max
      ) {
        throw new Error(
          `${name} must be between ${min} and ${max}`
        );
      }

      return number;
    };

    let parsedDeliveryLatitude: number | null;
    let parsedDeliveryLongitude: number | null;
    let parsedCurrentLatitude: number | null;
    let parsedCurrentLongitude: number | null;

    try {
      parsedDeliveryLatitude = parseCoordinate(
        deliveryLatitude,
        "Delivery latitude",
        -90,
        90
      );

      parsedDeliveryLongitude = parseCoordinate(
        deliveryLongitude,
        "Delivery longitude",
        -180,
        180
      );

      parsedCurrentLatitude = parseCoordinate(
        currentLatitude,
        "Current latitude",
        -90,
        90
      );

      parsedCurrentLongitude = parseCoordinate(
        currentLongitude,
        "Current longitude",
        -180,
        180
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid coordinates",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        deliveryAddress:
          deliveryAddress === undefined
            ? undefined
            : String(deliveryAddress).trim() || null,

        deliveryLatitude:
          parsedDeliveryLatitude,

        deliveryLongitude:
          parsedDeliveryLongitude,

        currentLatitude:
          parsedCurrentLatitude,

        currentLongitude:
          parsedCurrentLongitude,
      },
      select: {
        id: true,
        deliveryAddress: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        currentLatitude: true,
        currentLongitude: true,
      },
    });

    return NextResponse.json({
      message: "Tracking information updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/orders/[id]/tracking error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update tracking information" },
      { status: 500 }
    );
  }
}
