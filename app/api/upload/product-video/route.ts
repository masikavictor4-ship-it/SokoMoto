import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const IMAGE_EXTENSIONS = [".jpg", ".jpeg"];
const VIDEO_EXTENSIONS = [".mp4"];

const IMAGE_MIME_TYPES = [
  "image/jpeg",
];

const VIDEO_MIME_TYPES = [
  "video/mp4",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No file was uploaded.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "The selected file is empty.",
        },
        { status: 400 }
      );
    }

    const extension = path.extname(file.name).toLowerCase();
    const mimeType = (file.type || "").toLowerCase();

    const isImage = IMAGE_EXTENSIONS.includes(extension);
    const isVideo = VIDEO_EXTENSIONS.includes(extension);

    console.log("PRODUCT MEDIA UPLOAD:");
    console.log("Name:", file.name);
    console.log("Type:", mimeType || "(empty)");
    console.log("Size:", file.size);
    console.log("Extension:", extension);

    if (isImage) {
      if (
        mimeType &&
        !IMAGE_MIME_TYPES.includes(mimeType)
      ) {
        return NextResponse.json(
          {
            error:
              "The selected file does not appear to be a JPEG image.",
            receivedType: mimeType,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error:
              "Image is too large. Maximum size is 10MB.",
          },
          { status: 400 }
        );
      }
    } else if (isVideo) {
      if (
        mimeType &&
        !VIDEO_MIME_TYPES.includes(mimeType)
      ) {
        return NextResponse.json(
          {
            error:
              "The selected file does not appear to be an MP4 video.",
            receivedType: mimeType,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            error:
              "Video is too large. Maximum size is 100MB.",
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Please upload a JPEG/JPG image or MP4 video.",
          receivedType: mimeType || "unknown",
          receivedExtension: extension || "none",
        },
        { status: 400 }
      );
    }

    const filename =
      `${crypto.randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(
      uploadDirectory,
      filename
    );

    const bytes = await file.arrayBuffer();

    await writeFile(
      filePath,
      Buffer.from(bytes)
    );

    const url =
      `/uploads/products/${filename}`;

    const mediaType = isImage
      ? "image"
      : "video";

    console.log(
      "PRODUCT MEDIA UPLOADED:",
      url
    );

    return NextResponse.json(
      {
        success: true,
        url,
        filename,
        originalName: file.name,
        size: file.size,
        type: mimeType,
        mediaType,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT MEDIA UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to upload file.",
      },
      {
        status: 500,
      }
    );
  }
}
