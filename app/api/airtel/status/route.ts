import { NextResponse } from "next/server";

import {
  getAirtelTransactionStatus,
} from "@/lib/airtel";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
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

    const url =
      new URL(request.url);

    const orderId =
      Number(
        url.searchParams.get(
          "orderId"
        )
      );

    if (
      !Number.isInteger(
        orderId
      ) ||
      orderId < 1
    ) {
      return NextResponse.json(
        {
          error:
            "A valid orderId is required.",
        },
        { status: 400 }
      );
    }

    const order =
      await prisma.order.findFirst({
        where: {
          id: orderId,
          userId:
            user.id,
          paymentMethod:
            "AIRTEL_MONEY",
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Airtel Money order not found.",
        },
        { status: 404 }
      );
    }

    if (
      order.paymentStatus ===
      "PAID"
    ) {
      return NextResponse.json({
        orderId:
          order.id,

        paymentStatus:
          order.paymentStatus,

        status:
          order.status,

        transactionId:
          order.airtelTransactionId,
      });
    }

    if (
      !order.airtelTransactionId
    ) {
      return NextResponse.json(
        {
          error:
            "No Airtel transaction ID is available yet.",

          orderId:
            order.id,

          paymentStatus:
            order.paymentStatus,
        },
        { status: 400 }
      );
    }

    const statusResponse =
      await getAirtelTransactionStatus(
        order.airtelTransactionId
      );

    const transaction =
      statusResponse?.data
        ?.transaction;

    const status =
      transaction?.status;

    const statusCode =
      transaction?.statusCode;

    return NextResponse.json({
      orderId:
        order.id,

      paymentStatus:
        order.paymentStatus,

      orderStatus:
        order.status,

      airtelStatus:
        status,

      airtelStatusCode:
        statusCode,

      transaction:
        statusResponse,
    });
  } catch (error) {
    console.error(
      "Airtel status error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to query Airtel transaction status.",
      },
      { status: 500 }
    );
  }
}
