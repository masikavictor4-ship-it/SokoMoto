import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteUploadedImage,
  saveUploadedImage,
} from "@/lib/uploads";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: Params
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

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const contentType =
      request.headers.get("content-type") || "";

    let name = existingProduct.name;
    let description = existingProduct.description;
    let price = existingProduct.price;
    let stock = existingProduct.stock;
    let image = existingProduct.image;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const submittedName = formData.get("name");
      const submittedDescription =
        formData.get("description");
      const submittedPrice = formData.get("price");
      const submittedStock = formData.get("stock");

      if (submittedName !== null) {
        name = String(submittedName).trim();
      }

      if (submittedDescription !== null) {
        description =
          String(submittedDescription).trim();
      }

      if (submittedPrice !== null) {
        price = Number(submittedPrice);
      }

      if (submittedStock !== null) {
        stock = Number(submittedStock);
      }

      const imageFile = formData.get("imageFile");

      if (imageFile instanceof File && imageFile.size > 0) {
        const oldImage = image;

        image = await saveUploadedImage(
          imageFile,
          "products"
        );

        await deleteUploadedImage(oldImage);
      } else {
        const imageUrl = formData.get("imageUrl");

        if (imageUrl !== null) {
          const value = String(imageUrl).trim();

          if (value) {
            image = value;
          }
        }

        const removeImage =
          String(
            formData.get("removeImage") || ""
          ) === "true";

        if (removeImage) {
          await deleteUploadedImage(image);
          image = null;
        }
      }
    } else {
      const body = await request.json();

      if (typeof body.name === "string") {
        name = body.name.trim();
      }

      if (typeof body.description === "string") {
        description = body.description.trim();
      }

      if (body.price !== undefined) {
        price = Number(body.price);
      }

      if (body.stock !== undefined) {
        stock = Number(body.stock);
      }

      if (typeof body.image === "string") {
        image = body.image.trim() || null;
      }
    }

    if (!name || !description) {
      return NextResponse.json(
        {
          error:
            "Name and description are required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid non-negative number." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stock must be a non-negative whole number." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name,
        description,
        price,
        stock,
        image,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Update product error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: Params
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

    const product =
      await prisma.product.findUnique({
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

    const orderItemCount =
      await prisma.orderItem.count({
        where: {
          productId,
        },
      });

    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          error:
            "This product cannot be deleted because it is already part of an order.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          productId,
        },
      });

      await tx.product.delete({
        where: {
          id: productId,
        },
      });
    });

    await deleteUploadedImage(product.image);

    return NextResponse.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete product.",
      },
      { status: 500 }
    );
  }
}
