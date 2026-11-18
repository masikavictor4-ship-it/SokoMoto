import { NextResponse } from "next/server";

import {
  createAirtelReference,
  extractAirtelError,
  initiateAirtelCollection,
  normalizeAirtelPhone,
} from "@/lib/airtel";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const phoneNumber =
      String(
        body?.phoneNumber ?? ""
      ).trim();

    const orderId =
      Number(body?.orderId);

    if (!phoneNumber) {
      return NextResponse.json(
        {
          error:
            "Airtel Money phone number is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(orderId) ||
      orderId < 1
    ) {
      return NextResponse.json(
        {
          error:
            "A valid order ID is required.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone =
      normalizeAirtelPhone(
        phoneNumber
      );

    if (
      !/^254(7|1)\d{8}$/.test(
        normalizedPhone
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Kenyan Airtel Money number, for example 0712345678.",
        },
        { status: 400 }
      );
    }

    const order =
      await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
        },
        include: {
          items: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    if (
      order.paymentStatus ===
      "PAID"
    ) {
      return NextResponse.json(
        {
          error:
            "This order has already been paid.",
        },
        { status: 400 }
      );
    }

    if (
      order.paymentMethod !==
      "AIRTEL_MONEY"
    ) {
      return NextResponse.json(
        {
          error:
            "This order is not configured for Airtel Money.",
        },
        { status: 400 }
      );
    }

    /*
     * Don't create another Airtel transaction
     * if this order already has one awaiting
     * completion.
     */
    if (
      order.airtelTransactionId &&
      order.paymentStatus ===
        "PENDING"
    ) {
      return NextResponse.json(
        {
          message:
            "An Airtel Money payment is already awaiting confirmation.",
          orderId: order.id,
          reference:
            order.airtelReference,
          transactionId:
            order.airtelTransactionId,
          paymentStatus:
            order.paymentStatus,
        },
        { status: 200 }
      );
    }

    /*
     * Generate a unique merchant reference.
     */
    const reference =
      createAirtelReference(
        order.id
      );

    /*
     * Mark the order as awaiting payment
     * before contacting Airtel.
     */
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentMethod:
          "AIRTEL_MONEY",

        paymentStatus:
          "PENDING",

        phoneNumber:
          normalizedPhone,

        airtelReference:
          reference,
      },
    });

    try {
      const airtelResponse =
        await initiateAirtelCollection({
          orderId: order.id,
          phoneNumber:
            normalizedPhone,
          amount: order.total,
          reference,
        });

      const transaction =
        airtelResponse?.data
          ?.transaction;

      const transactionId =
        transaction?.id ||
        transaction
          ?.airtel_money_id ||
        null;

      if (
        transactionId
      ) {
        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            airtelTransactionId:
              String(
                transactionId
              ),
          },
        });
      }

      return NextResponse.json(
        {
          message:
            "Airtel Money payment request sent. Check your Airtel phone and approve the payment.",

          orderId:
            order.id,

          amount:
            order.total,

          phoneNumber:
            normalizedPhone,

          reference,

          transactionId,

          paymentStatus:
            "PENDING",

          airtelResponse,
        },
        { status: 201 }
      );
    } catch (airtelError) {
      console.error(
        "Airtel collection failed:",
        airtelError
      );

      /*
       * Return the order to an unpaid state.
       * Keep the order so the customer/admin has
       * a trace of the failed payment attempt.
       */
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus:
            "UNPAID",
          airtelReference:
            reference,
        },
      });

      return NextResponse.json(
        {
          error:
            airtelError instanceof Error
              ? airtelError.message
              : "Airtel Money payment request failed.",

          reference,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error(
      "Airtel collection route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate Airtel Money payment.",
      },
      { status: 500 }
    );
  }
}
