import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const url = String(body.url || "").trim();

    if (!url) {
      return NextResponse.json(
        { error: "Video URL is required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const video = await prisma.productVideo.create({
      data: {
        url,
        productId,
      },
    });

    return NextResponse.json(video, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "ADD PRODUCT VIDEO ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to attach video." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = Number(id);

    const body = await request.json();
    const videoId = Number(body.videoId);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(videoId)
    ) {
      return NextResponse.json(
        { error: "Invalid product or video ID." },
        { status: 400 }
      );
    }

    const video = await prisma.productVideo.findFirst({
      where: {
        id: videoId,
        productId,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found." },
        { status: 404 }
      );
    }

    await prisma.productVideo.delete({
      where: {
        id: videoId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT VIDEO ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to delete video." },
      { status: 500 }
    );
  }
}
