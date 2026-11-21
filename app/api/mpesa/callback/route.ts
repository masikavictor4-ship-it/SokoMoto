
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
    const checkoutRequestId = callback.CheckoutRequestID;

    if (!checkoutRequestId) {
      console.error("Missing CheckoutRequestID.");

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received.",
      });
    }

    const order = await prisma.order.findUnique({
      where: { checkoutRequestId },
      include: { items: true },
    });

    if (!order) {
      console.error(
        "No order found for CheckoutRequestID:",
        checkoutRequestId
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Order not found.",
      });
    }

    if (order.paymentMethod !== "MPESA") {
      console.error("Callback received for a non-M-Pesa order.");

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Invalid payment method.",
      });
    }

    if (order.paymentStatus === "PAID") {
      console.log(`Order ${order.id} is already paid.`);

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback already processed.",
      });
    }

    // Handle unsuccessful, cancelled or timed-out payments.
    if (resultCode !== 0) {
      console.log(
        "M-Pesa payment was not completed:",
        callback.ResultDesc
      );

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
        },
      });

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Failed payment callback processed.",
      });
    }

    // Read the successful payment metadata.
    const metadata = callback.CallbackMetadata?.Item || [];

    const getMetadataValue = (name: string) => {
      const item = metadata.find(
        (entry: { Name: string; Value?: unknown }) =>
          entry.Name === name
      );

      return item?.Value;
    };

    const transactionId = getMetadataValue("MpesaReceiptNumber");
    const phoneNumber = getMetadataValue("PhoneNumber");
    const amount = Number(getMetadataValue("Amount"));

    // Never mark an order paid without a receipt number.
    if (!transactionId) {
      console.error("Successful callback is missing the M-Pesa receipt.");

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Missing payment receipt.",
      });
    }

    // Verify the amount received against the expected order amount.
    const expectedAmount = Math.round(order.total);

    if (
      !Number.isFinite(amount) ||
      amount !== expectedAmount
    ) {
      console.error("M-Pesa payment amount mismatch.", {
        orderId: order.id,
        expectedAmount,
        receivedAmount: amount,
      });

      // Leave the order unpaid for investigation.
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Payment amount mismatch. Order not marked as paid.",
      });
    }

    console.log("Payment amount verified.");
    console.log("Order ID:", order.id);
    console.log("Expected amount:", expectedAmount);
    console.log("Received amount:", amount);
    console.log("Receipt:", transactionId);

    // Process payment, stock and cart together.
    await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (!currentOrder) {
        throw new Error("Order no longer exists.");
      }

      // Prevent duplicate payment processing.
      if (currentOrder.paymentStatus === "PAID") {
        return;
      }

      // Check product stock before reducing it.
      for (const item of currentOrder.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
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

      // Reduce stock after the successful payment.
      for (const item of currentOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Mark the order as paid.
      await tx.order.update({
        where: { id: currentOrder.id },
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

      // Clear this customer's cart.
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
      ResultDesc: "Payment callback processed successfully.",
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);

    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: "Callback processing failed.",
      },
      { status: 500 }
    );
  }
}
