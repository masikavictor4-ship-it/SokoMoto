import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ChatRequest = {
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        {
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    const text = message.toLowerCase();

    // Get products so the chatbot can answer basic product questions.
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    let reply =
      "Thanks for contacting SokoMtaani! I can help with products, prices, stock, orders, carts, and checkout.";

    if (
      text.includes("hello") ||
      text.includes("hi") ||
      text.includes("hey")
    ) {
      reply =
        "Hello 👋 Welcome to SokoMtaani! How can I help you today?";
    } else if (
      text.includes("product") ||
      text.includes("products") ||
      text.includes("available") ||
      text.includes("what do you sell")
    ) {
      if (products.length === 0) {
        reply = "We currently don't have any products available.";
      } else {
        const productList = products
          .slice(0, 5)
          .map(
            (product) =>
              `• ${product.name} — KSh ${product.price.toLocaleString()}`
          )
          .join("\n");

        reply = `Here are some products currently available:\n\n${productList}\n\nVisit the Products page to see the full catalogue.`;
      }
    } else if (
      text.includes("price") ||
      text.includes("cost") ||
      text.includes("how much")
    ) {
      const matchedProduct = products.find((product) => {
        const name = product.name.toLowerCase();
        return text.includes(name) || name.split(" ").some((word) => word.length > 3 && text.includes(word));
      });

      if (matchedProduct) {
        reply = `${matchedProduct.name} costs KSh ${matchedProduct.price.toLocaleString()}. ${
          matchedProduct.stock > 0
            ? `We currently have ${matchedProduct.stock} in stock.`
            : "It is currently out of stock."
        }`;
      } else {
        reply =
          "Please tell me the product name and I can help you check its price.";
      }
    } else if (
      text.includes("stock") ||
      text.includes("in stock") ||
      text.includes("available")
    ) {
      const matchedProduct = products.find((product) => {
        const name = product.name.toLowerCase();
        return name.split(" ").some((word) => word.length > 3 && text.includes(word));
      });

      if (matchedProduct) {
        reply =
          matchedProduct.stock > 0
            ? `Yes 👍 ${matchedProduct.name} is currently in stock. We have ${matchedProduct.stock} available.`
            : `${matchedProduct.name} is currently out of stock.`;
      } else {
        const available = products.filter((product) => product.stock > 0);

        reply =
          available.length > 0
            ? `We currently have ${available.length} product(s) with available stock. Tell me the product name and I'll check it for you.`
            : "Our products are currently out of stock.";
      }
    } else if (
      text.includes("cart") ||
      text.includes("add to cart")
    ) {
      reply =
        "To add an item to your cart, log in to your SokoMtaani account, open Products, and click Add to Cart. You can then open your Cart to review your items.";
    } else if (
      text.includes("order") ||
      text.includes("orders")
    ) {
      reply =
        "After placing an order, you can use the Orders section of your SokoMtaani account to view your orders and their status.";
    } else if (
      text.includes("mpesa") ||
      text.includes("m-pesa") ||
      text.includes("payment") ||
      text.includes("pay")
    ) {
      reply =
        "SokoMtaani checkout supports M-Pesa payments. Enter your Kenyan phone number during checkout and follow the payment instructions.";
    } else if (
      text.includes("checkout") ||
      text.includes("buy")
    ) {
      reply =
        "To checkout, add your products to the cart, open Cart, review your items, enter your phone number, and continue with checkout.";
    } else if (
      text.includes("login") ||
      text.includes("log in") ||
      text.includes("sign in")
    ) {
      reply =
        "You need to log in to access Products, add items to your cart, and place orders. If you don't have an account, you can create one from the Register page.";
    } else if (
      text.includes("register") ||
      text.includes("create account") ||
      text.includes("sign up")
    ) {
      reply =
        "Creating an account is easy. Click Create Account and enter your name, email, and password.";
    } else if (
      text.includes("help") ||
      text.includes("support")
    ) {
      reply =
        "I'm here to help 😊 You can ask me about products, prices, stock, your cart, checkout, M-Pesa payments, login, or orders.";
    }

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);

    return NextResponse.json(
      {
        error: "The chat service is temporarily unavailable.",
      },
      { status: 500 }
    );
  }
}
