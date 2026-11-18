import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const phoneNumber = String(
      body?.phoneNumber ?? ""
    ).trim();

    const deliveryAddress = String(
      body?.deliveryAddress ?? ""
    ).trim();

    const deliveryLatitude = Number(
      body?.deliveryLatitude
    );

    const deliveryLongitude = Number(
      body?.deliveryLongitude
    );

    console.log("========== CHECKOUT DELIVERY DEBUG ==========");
    console.log("Phone:", phoneNumber);
    console.log("Delivery address:", deliveryAddress);
    console.log("Delivery latitude:", deliveryLatitude);
    console.log("Delivery longitude:", deliveryLongitude);
    console.log("Raw checkout body:", body);
    console.log("==============================================");

    if (!phoneNumber) {
      return NextResponse.json(
        {
          error:
            "M-Pesa phone number is required.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone =
      phoneNumber.replace(/\s+/g, "");

    if (
      !/^(\+254|254|0)(7|1)\d{8}$/.test(
        normalizedPhone
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Kenyan M-Pesa number, for example 0712345678.",
        },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        {
          error:
            "Delivery address is required.",
        },
        { status: 400 }
      );
    }

    if (deliveryAddress.length > 500) {
      return NextResponse.json(
        {
          error:
            "Delivery address is too long.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(deliveryLatitude) ||
      deliveryLatitude < -90 ||
      deliveryLatitude > 90
    ) {
      return NextResponse.json(
        {
          error:
            "A valid delivery latitude is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(deliveryLongitude) ||
      deliveryLongitude < -180 ||
      deliveryLongitude > 180
    ) {
      return NextResponse.json(
        {
          error:
            "A valid delivery longitude is required.",
        },
        { status: 400 }
      );
    }

    const cartItems =
      await prisma.cartItem.findMany({
        where: {
          userId: user.id,
        },
        include: {
          product: true,
        },
      });

    if (cartItems.length === 0) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    for (const item of cartItems) {
      if (
        item.quantity >
        item.product.stock
      ) {
        const errorMessage =
          "Not enough stock for " +
          item.product.name +
          ". Only " +
          item.product.stock +
          " available.";

        return NextResponse.json(
          {
            error: errorMessage,
          },
          { status: 400 }
        );
      }
    }

    const total = cartItems.reduce(
      (sum, item) => {
        return (
          sum +
          item.product.price *
            item.quantity
        );
      },
      0
    );

    const order =
      await prisma.order.create({
        data: {
          userId: user.id,
          total: total,
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentMethod: "MPESA",
          phoneNumber: normalizedPhone,

          deliveryAddress:
            deliveryAddress,

          deliveryLatitude:
            deliveryLatitude,

          deliveryLongitude:
            deliveryLongitude,

          items: {
            create: cartItems.map(
              (item) => ({
                productId:
                  item.productId,
                quantity:
                  item.quantity,
                price:
                  item.product.price,
              })
            ),
          },
        },

        include: {
          items: true,
        },
      });

    console.log(
      "Checkout order created:",
      order.id
    );

    const stkResponse =
      await fetch(
        new URL(
          "/api/mpesa/stkpush",
          request.url
        ),
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Cookie:
              request.headers.get(
                "cookie"
              ) || "",
          },

          body: JSON.stringify({
            phoneNumber:
              normalizedPhone,

            orderId:
              order.id,
          }),
        }
      );

    const stkData =
      await stkResponse.json();

    console.log(
      "STK response:",
      stkData
    );

    if (!stkResponse.ok) {
      await prisma.orderItem.deleteMany(
        {
          where: {
            orderId: order.id,
          },
        }
      );

      await prisma.order.delete({
        where: {
          id: order.id,
        },
      });

      return NextResponse.json(
        {
          error:
            stkData.error ||
            "Failed to initiate M-Pesa payment.",
        },
        { status: 500 }
      );
    }

    const checkoutRequestId =
      stkData?.data?.CheckoutRequestID;

    if (!checkoutRequestId) {
      await prisma.orderItem.deleteMany(
        {
          where: {
            orderId: order.id,
          },
        }
      );

      await prisma.order.delete({
        where: {
          id: order.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "M-Pesa did not return a CheckoutRequestID.",
        },
        { status: 500 }
      );
    }

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          checkoutRequestId:
            checkoutRequestId,
        },
      });

    return NextResponse.json(
      {
        message:
          "M-Pesa payment request sent. Check your phone and enter your M-Pesa PIN.",

        order: {
          id: updatedOrder.id,
          total: updatedOrder.total,
          status: updatedOrder.status,
          paymentStatus:
            updatedOrder.paymentStatus,
          paymentMethod:
            updatedOrder.paymentMethod,
          phoneNumber:
            updatedOrder.phoneNumber,
          checkoutRequestId:
            updatedOrder.checkoutRequestId,
          deliveryAddress:
            updatedOrder.deliveryAddress,
          deliveryLatitude:
            updatedOrder.deliveryLatitude,
          deliveryLongitude:
            updatedOrder.deliveryLongitude,
        },

        stkResponse:
          stkData.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CHECKOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout order.",
      },
      { status: 500 }
    );
  }
}
