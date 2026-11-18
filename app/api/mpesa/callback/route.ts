import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("========== M-PESA CALLBACK ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================");

    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    const resultCode = Number(callback.ResultCode);
    const checkoutRequestId =
      callback.CheckoutRequestID;

    if (!checkoutRequestId) {
      console.error(
        "M-Pesa callback missing CheckoutRequestID."
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        checkoutRequestId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      console.error(
        "No order found for CheckoutRequestID:",
        checkoutRequestId
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    /*
     * Idempotency:
     *
     * If Safaricom sends the successful callback more than once,
     * do not reduce stock or clear the cart again.
     */
    if (order.paymentStatus === "PAID") {
      console.log(
        `Order ${order.id} is already PAID. Ignoring duplicate callback.`
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback already processed.",
      });
    }

    /*
     * Payment failed, cancelled, timed out, or was rejected.
     */
    if (resultCode !== 0) {
      console.log(
        "M-Pesa payment was not completed:",
        callback.ResultDesc
      );

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
        },
      });

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback processed.",
      });
    }

    const metadata = callback.CallbackMetadata?.Item || [];

    const getMetadataValue = (name: string) => {
      const item = metadata.find(
        (entry: { Name: string }) =>
          entry.Name === name
      );

      return item?.Value;
    };

    const transactionId =
      getMetadataValue("MpesaReceiptNumber");

    const phoneNumber =
      getMetadataValue("PhoneNumber");

    const amount =
      getMetadataValue("Amount");

    console.log("Payment successful");
    console.log("Order ID:", order.id);
    console.log("Transaction ID:", transactionId);
    console.log("Phone:", phoneNumber);
    console.log("Amount:", amount);

    if (!transactionId) {
      console.error(
        "Successful callback did not contain M-Pesa receipt number."
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    /*
     * Process payment, stock and cart together.
     */
    await prisma.$transaction(async (tx) => {
      /*
       * Re-check the order inside the transaction.
       * This protects against duplicate callback processing.
       */
      const currentOrder = await tx.order.findUnique({
        where: {
          id: order.id,
        },
        include: {
          items: true,
        },
      });

      if (!currentOrder) {
        throw new Error("Order no longer exists.");
      }

      if (currentOrder.paymentStatus === "PAID") {
        return;
      }

      /*
       * Check stock again immediately before payment confirmation.
       */
      for (const item of currentOrder.items) {
        const product = await tx.product.findUnique({
          where: {
            id: item.productId,
          },
        });

        if (!product) {
          throw new Error(
            `Product ${item.productId} no longer exists.`
          );
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}.`
          );
        }
      }

      /*
       * Reduce stock only after successful payment.
       */
      for (const item of currentOrder.items) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      /*
       * Mark the order as paid.
       */
      await tx.order.update({
        where: {
          id: currentOrder.id,
        },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          transactionId: String(transactionId),
          phoneNumber: phoneNumber
            ? String(phoneNumber)
            : currentOrder.phoneNumber,
          paidAt: new Date(),
        },
      });

      /*
       * Clear only this customer's cart.
       */
      await tx.cartItem.deleteMany({
        where: {
          userId: currentOrder.userId,
        },
      });
    });

    console.log(
      `Order ${order.id} successfully marked as PAID.`
    );

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc:
        "Payment callback processed successfully.",
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);

    /*
     * Acknowledge the callback so Safaricom does not repeatedly
     * resend it. The error remains in the server logs.
     */
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback received.",
    });
  }
}
