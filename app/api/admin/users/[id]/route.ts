import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: Context
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    /*
     * ROLE UPDATE
     */
    if (body.role !== undefined) {
      const role = body.role;

      if (role !== "CUSTOMER" && role !== "ADMIN") {
        return NextResponse.json(
          { error: "Role must be CUSTOMER or ADMIN." },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      return NextResponse.json(updatedUser);
    }

    /*
     * ACCOUNT STATUS UPDATE
     */
    if (body.status !== undefined) {
      const status = body.status;

      if (status !== "ACTIVE" && status !== "DEACTIVATED") {
        return NextResponse.json(
          {
            error:
              "Status must be ACTIVE or DEACTIVATED.",
          },
          { status: 400 }
        );
      }

      /*
       * Prevent an admin from deactivating
       * their own account.
       */
      if (
        userId === currentUser.id &&
        status === "DEACTIVATED"
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot deactivate your own admin account.",
          },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          status,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json(
      {
        error:
          "Provide either a role or status to update.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin user PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: Context
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own admin account.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (user._count.orders > 0) {
      return NextResponse.json(
        {
          error:
            "This user has orders and cannot be deleted. Keep the account to preserve order history.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          userId,
        },
      });

      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Admin user DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
