import { NextResponse } from "next/server";
import axios from "axios";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMpesaAccessToken, getMpesaBaseUrl } from "@/lib/mpesa";

function getTimestamp() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}${get(
    "hour"
  )}${get("minute")}${get("second")}`;
}

function normalizePhone(phone: string) {
  const value = phone.replace(/\s+/g, "").trim();

  if (value.startsWith("+254")) {
    return value.substring(1);
  }

  if (value.startsWith("07") || value.startsWith("01")) {
    return `254${value.substring(1)}`;
  }

  if (value.startsWith("254")) {
    return value;
  }

  return value;
}

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

    const phoneNumber = String(body?.phoneNumber ?? "").trim();
    const orderId = Number(body?.orderId);

    console.log("========== M-PESA STK PUSH ==========");
    console.log("Phone:", phoneNumber);
    console.log("Order ID:", orderId);

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "M-Pesa phone number is required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(orderId) || orderId < 1) {
      return NextResponse.json(
        { error: "A valid order ID is required." },
        { status: 400 }
      );
    }

    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!shortcode || !passkey || !callbackUrl) {
      return NextResponse.json(
        {
          error:
            "M-Pesa configuration is incomplete. Check your environment variables.",
        },
        { status: 500 }
      );
    }

    const normalizedPhone = normalizePhone(phoneNumber);

    if (!/^254(7|1)\d{8}$/.test(normalizedPhone)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Kenyan M-Pesa number, for example 0712345678.",
        },
        { status: 400 }
      );
    }

    /*
     * The checkout route already creates the order.
     * We retrieve that order instead of creating another one.
     */
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 400 }
      );
    }

    /*
     * Store the normalized phone number on the existing order.
     */
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        phoneNumber: normalizedPhone,
      },
    });

    const accessToken = await getMpesaAccessToken();

    const timestamp = getTimestamp();

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(order.total),
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `ORDER-${order.id}`,
      TransactionDesc: `SokoMtaani Order ${order.id}`,
    };

    console.log("Sending STK Push to Daraja...");

    const response = await axios.post(
      `${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("========== DARAJA RESPONSE ==========");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("======================================");

    const checkoutRequestId =
      response.data?.CheckoutRequestID;

    if (!checkoutRequestId) {
      return NextResponse.json(
        {
          error:
            "M-Pesa did not return a CheckoutRequestID.",
        },
        { status: 500 }
      );
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        checkoutRequestId,
      },
    });

    return NextResponse.json({
      message: "M-Pesa payment request sent.",
      orderId: order.id,
      data: response.data,
    });
  } catch (error) {
    console.error("========== M-PESA STK ERROR ==========");

    if (axios.isAxiosError(error)) {
      console.error("AXIOS STATUS:", error.response?.status);
      console.error("AXIOS STATUS TEXT:", error.response?.statusText);
      console.error("AXIOS DATA:", error.response?.data);
      console.error("AXIOS HEADERS:", error.response?.headers);
      console.error("AXIOS MESSAGE:", error.message);
      console.error("AXIOS CODE:", error.code);

      return NextResponse.json(
        {
          error:
            error.response?.data?.errorMessage ||
            error.response?.data?.ResponseDescription ||
            error.response?.data?.error ||
            error.message ||
            "M-Pesa STK Push failed.",
        },
        { status: 500 }
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "M-Pesa STK Push failed.",
      },
      { status: 500 }
    );
  }
}
