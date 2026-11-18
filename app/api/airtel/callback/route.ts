import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function getString(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const result =
    String(value).trim();

  return result || null;
}

function getCallbackValue(
  body: any,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value =
      body?.[key];

    const result =
      getString(value);

    if (result) {
      return result;
    }
  }

  return null;
}

function isSuccessful(
  status: string | null,
  statusCode: string | null
) {
  const s =
    String(status ?? "")
      .trim()
      .toLowerCase();

  const c =
    String(statusCode ?? "")
      .trim()
      .toUpperCase();

  return (
    s === "success" ||
    s === "successful" ||
    s === "completed" ||
    s === "paid" ||
    c === "00"
  );
}

function isFailed(
  status: string | null,
  statusCode: string | null
) {
  const s =
    String(status ?? "")
      .trim()
      .toLowerCase();

  const c =
    String(statusCode ?? "")
      .trim()
      .toUpperCase();

  return (
    s === "failed" ||
    s === "failure" ||
    s === "cancelled" ||
    s === "canceled" ||
    s === "rejected" ||
    s === "expired" ||
    c === "TF"
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    console.log(
      "========== AIRTEL CALLBACK =========="
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    console.log(
      "======================================"
    );

    /*
     * Airtel callback payloads can differ
     * slightly depending on the API product/version.
     *
     * Support both flat and nested forms.
     */
    const transaction =
      body?.data
        ?.transaction ||
      body?.transaction ||
      {};

    const reference =
      getString(
        transaction.reference
      ) ||
      getString(
        body?.reference
      ) ||
      getString(
        body?.data?.reference
      );

    const transactionId =
      getString(
        transaction.id
      ) ||
      getString(
        transaction.transactionId
      ) ||
      getString(
        transaction.airtel_money_id
      ) ||
      getString(
        body?.transactionId
      ) ||
      getString(
        body?.airtel_money_id
      );

    const status =
      getString(
        transaction.status
      ) ||
      getString(
        body?.status
      );

    const statusCode =
      getString(
        transaction.statusCode
      ) ||
      getString(
        body?.statusCode
      ) ||
      getString(
        body?.status?.code
      );

    const phoneNumber =
      getString(
        transaction.msisdn
      ) ||
      getString(
        transaction.phone
      ) ||
      getString(
        body?.phone
      );

    const amount =
      getString(
        transaction.amount
      ) ||
      getString(
        body?.amount
      );

    console.log(
      "Airtel reference:",
      reference
    );

    console.log(
      "Airtel transaction:",
      transactionId
    );

    console.log(
      "Airtel status:",
      status
    );

    console.log(
      "Airtel status code:",
      statusCode
    );

    console.log(
      "Airtel phone:",
      phoneNumber
    );

    console.log(
      "Airtel amount:",
      amount
    );

    if (
      !reference &&
      !transactionId
    ) {
      console.error(
        "Airtel callback contains neither reference nor transaction ID."
      );

      /*
       * Acknowledge the webhook.
       * The payload remains in server logs.
       */
      return NextResponse.json(
        {
          success: true,
          message:
            "Callback received.",
        }
      );
    }

    /*
     * Find the order using the strongest
     * available identifier.
     */
    let order = null;

    if (reference) {
      order =
        await prisma.order.findFirst({
          where: {
            airtelReference:
              reference,
          },
          include: {
            items: true,
          },
        });
    }

    if (
      !order &&
      transactionId
    ) {
      order =
        await prisma.order.findFirst({
          where: {
            airtelTransactionId:
              transactionId,
          },
          include: {
            items: true,
          },
        });
    }

    /*
     * Some Airtel configurations return the
     * merchant reference as the transaction ID.
     */
    if (
      !order &&
      transactionId
    ) {
      order =
        await prisma.order.findFirst({
          where: {
            airtelReference:
              transactionId,
          },
          include: {
            items: true,
          },
        });
    }

    if (!order) {
      console.error(
        "No order found for Airtel callback:",
        {
          reference,
          transactionId,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Callback received.",
        }
      );
    }

    /*
     * Idempotency.
     */
    if (
      order.paymentStatus ===
      "PAID"
    ) {
      console.log(
        `Order ${order.id} already PAID. Ignoring duplicate Airtel callback.`
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Callback already processed.",
        }
      );
    }

    /*
     * Failed payment.
     */
    if (
      isFailed(
        status,
        statusCode
      )
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus:
            "FAILED",

          status:
            "CANCELLED",

          airtelTransactionId:
            transactionId ||
            order.airtelTransactionId,

          phoneNumber:
            phoneNumber ||
            order.phoneNumber,
        },
      });

      console.log(
        `Airtel payment failed for order ${order.id}.`
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Callback processed.",
        }
      );
    }

    /*
     * If Airtel says it is still pending,
     * don't touch stock/cart/payment completion.
     */
    if (
      !isSuccessful(
        status,
        statusCode
      )
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus:
            "PENDING",

          airtelTransactionId:
            transactionId ||
            order.airtelTransactionId,

          phoneNumber:
            phoneNumber ||
            order.phoneNumber,
        },
      });

      console.log(
        `Airtel payment for order ${order.id} remains pending.`
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Callback received. Payment is still pending.",
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Do not trust the amount supplied by the
     * customer's device.
     *
     * When Airtel supplies an amount, compare it
     * against our order total.
     */
    if (amount !== null) {
      const receivedAmount =
        Number(amount);

      if (
        Number.isFinite(
          receivedAmount
        ) &&
        Math.round(
          receivedAmount
        ) !==
          Math.round(
            order.total
          )
      ) {
        console.error(
          "Airtel payment amount mismatch:",
          {
            orderId:
              order.id,
            expected:
              order.total,
            received:
              receivedAmount,
          }
        );

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            paymentStatus:
              "FAILED",

            status:
              "CANCELLED",
          },
        });

        return NextResponse.json(
          {
            success: true,
            message:
              "Payment amount mismatch.",
          }
        );
      }
    }

    /*
     * Successful payment.
     *
     * Payment, stock reduction and cart clearing
     * happen in one database transaction.
     */
    await prisma.$transaction(
      async (tx) => {
        const currentOrder =
          await tx.order.findUnique({
            where: {
              id: order.id,
            },
            include: {
              items: true,
            },
          });

        if (!currentOrder) {
          throw new Error(
            "Order no longer exists."
          );
        }

        /*
         * Protect against duplicate callbacks
         * arriving simultaneously.
         */
        if (
          currentOrder.paymentStatus ===
          "PAID"
        ) {
          return;
        }

        /*
         * Re-check stock at the exact moment
         * payment is being confirmed.
         */
        for (const item of currentOrder.items) {
          const product =
            await tx.product.findUnique({
              where: {
                id: item.productId,
              },
            });

          if (!product) {
            throw new Error(
              `Product ${item.productId} no longer exists.`
            );
          }

          if (
            product.stock <
            item.quantity
          ) {
            throw new Error(
              `Insufficient stock for ${product.name}.`
            );
          }
        }

        /*
         * Reduce stock.
         */
        for (const item of currentOrder.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                decrement:
                  item.quantity,
              },
            },
          });
        }

        /*
         * Mark order as paid.
         */
        await tx.order.update({
          where: {
            id:
              currentOrder.id,
          },
          data: {
            paymentStatus:
              "PAID",

            status:
              "CONFIRMED",

            transactionId:
              transactionId ||
              currentOrder.transactionId,

            airtelTransactionId:
              transactionId ||
              currentOrder.airtelTransactionId,

            airtelReference:
              reference ||
              currentOrder.airtelReference,

            phoneNumber:
              phoneNumber ||
              currentOrder.phoneNumber,

            paidAt:
              new Date(),
          },
        });

        /*
         * Clear only the customer's cart.
         */
        await tx.cartItem.deleteMany({
          where: {
            userId:
              currentOrder.userId,
          },
        });
      }
    );

    console.log(
      `Order ${order.id} successfully marked as PAID through Airtel Money.`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Airtel payment callback processed successfully.",
      }
    );
  } catch (error) {
    console.error(
      "Airtel callback error:",
      error
    );

    /*
     * Acknowledge the callback.
     * The error is recorded server-side.
     */
    return NextResponse.json(
      {
        success: true,
        message:
          "Callback received.",
      }
    );
  }
}
