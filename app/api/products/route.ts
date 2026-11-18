import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        videos: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load products.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(
      body.description || ""
    ).trim();

    const price = Number(body.price);
    const stock = Number(body.stock || 0);

    const image =
      body.image === null ||
      body.image === undefined ||
      String(body.image).trim() === ""
        ? null
        : String(body.image).trim();

    if (!name) {
      return NextResponse.json(
        {
          error: "Product name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error: "Product description is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        {
          error: "Invalid product price.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          error: "Invalid stock quantity.",
        },
        {
          status: 400,
        }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        image,
      },
      include: {
        videos: true,
      },
    });

    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create product.",
      },
      {
        status: 500,
      }
    );
  }
}
