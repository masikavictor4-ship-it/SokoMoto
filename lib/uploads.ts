import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export async function saveUploadedImage(
  file: File,
  folder: string
): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("Please select an image.");
  }

  if (!file.name) {
    throw new Error("The selected file has no name.");
  }

  if (file.size <= 0) {
    throw new Error("The selected image is empty.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image is too large. Maximum size is 10MB.");
  }

  const extension = path.extname(file.name).toLowerCase();
  const mimeType = (file.type || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(
      "Unsupported image format. Please use JPG, JPEG, PNG, or WEBP."
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported image type: ${mimeType || "unknown"}. Please use JPG, PNG, or WEBP.`
    );
  }

  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");

  if (!safeFolder) {
    throw new Error("Invalid upload folder.");
  }

  const filename = `${crypto.randomUUID()}${extension}`;

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    safeFolder
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

  return `/uploads/${safeFolder}/${filename}`;
}

export async function deleteUploadedImage(
  imageUrl: string | null | undefined
): Promise<void> {
  if (!imageUrl) {
    return;
  }

  if (!imageUrl.startsWith("/uploads/")) {
    return;
  }

  const relativePath = imageUrl
    .replace(/^\/+/, "")
    .replace(/\.\./g, "");

  const filePath = path.join(
    process.cwd(),
    "public",
    relativePath
  );

  try {
    await unlink(filePath);
  } catch (error) {
    const code =
      error &&
      typeof error === "object" &&
      "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code !== "ENOENT") {
      console.error(
        "Failed to delete uploaded image:",
        error
      );
    }
  }
}
