import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteUploadedImage,
  saveUploadedImage,
} from "@/lib/uploads";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        status: true,
        profileImage: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (dbUser.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is not active." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 }
      );
    }

    let newImageUrl: string;

    try {
      newImageUrl = await saveUploadedImage(file, "profiles");
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid image.",
        },
        { status: 400 }
      );
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          profileImage: newImageUrl,
        },
        select: {
          profileImage: true,
        },
      });

      await deleteUploadedImage(dbUser.profileImage);

      return NextResponse.json({
        message: "Profile picture updated successfully.",
        profileImage: updatedUser.profileImage,
      });
    } catch (error) {
      await deleteUploadedImage(newImageUrl);
      throw error;
    }
  } catch (error) {
    console.error("Profile image upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload profile picture." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        profileImage: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImage: null,
      },
    });

    await deleteUploadedImage(dbUser.profileImage);

    return NextResponse.json({
      message: "Profile picture removed.",
    });
  } catch (error) {
    console.error("Profile image delete error:", error);

    return NextResponse.json(
      { error: "Failed to remove profile picture." },
      { status: 500 }
    );
  }
}
