"use client";

import { FormEvent, useEffect, useState } from "react";

type Video = {
  id: number;
  url: string;
  createdAt: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  videos: Video[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<number | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<number | null>(null);

  async function loadProducts() {
    try {
      const response = await fetch("/api/products", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(data);
      } else {
        setMessage(data.error || "Failed to load products.");
      }
    } catch {
      setMessage("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      image: "",
    });

    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const url = editingId
      ? `/api/products/${editingId}`
      : "/api/products";

    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock || 0),
          image: form.image || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setMessage(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      await loadProducts();
    } catch {
      setMessage("Something went wrong.");
    }
  }

  function editProduct(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteProduct(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to delete product.");
        return;
      }

      setMessage("Product deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadProducts();
    } catch {
      setMessage("Failed to delete product.");
    }
  }

  async function uploadImage(file: File) {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please select a JPG or JPEG image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image is too large. Maximum size is 10MB.");
      return;
    }

    setUploadingImage(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/product-video", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Image upload failed.");
        return;
      }

      if (data.mediaType !== "image") {
        setMessage("The uploaded file was not recognized as an image.");
        return;
      }

      setForm((current) => ({
        ...current,
        image: data.url,
      }));

      setMessage("Product image uploaded. Click Save/Update Product.");
    } catch {
      setMessage("Failed to upload product image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadVideo(productId: number, file: File) {
    if (!file) {
      return;
    }

    if (file.type !== "video/mp4") {
      setMessage("Please select an MP4 video.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setMessage("Video is too large. Maximum size is 100MB.");
      return;
    }

    setUploadingVideo(productId);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        "/api/upload/product-video",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        setMessage(
          uploadData.error || "Video upload failed."
        );
        return;
      }

      const attachResponse = await fetch(
        `/api/products/${productId}/videos`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: uploadData.url,
          }),
        }
      );

      const attachData = await attachResponse.json();

      if (!attachResponse.ok) {
        setMessage(
          attachData.error ||
            "Video uploaded but could not be attached."
        );
        return;
      }

      setMessage("Product video uploaded successfully.");

      await loadProducts();
    } catch {
      setMessage("Failed to upload product video.");
    } finally {
      setUploadingVideo(null);
    }
  }

  async function deleteVideo(
    productId: number,
    videoId: number
  ) {
    const confirmed = window.confirm(
      "Delete this product video?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingVideo(videoId);
    setMessage("");

    try {
      const response = await fetch(
        `/api/products/${productId}/videos`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Failed to delete video."
        );
        return;
      }

      setMessage("Video deleted successfully.");

      await loadProducts();
    } catch {
      setMessage("Failed to delete video.");
    } finally {
      setDeletingVideo(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-black text-violet-600">
            SokoMtaani Admin
          </h1>

          <div className="flex gap-3">
            <a
              href="/admin/orders"
              className="rounded-lg border px-4 py-2 font-semibold"
            >
              Orders
            </a>

            <a
              href="/dashboard"
              className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white"
            >
              Dashboard
            </a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl font-black">
          {editingId ? "Edit Product" : "Add Product"}
        </h2>

        <p className="mt-2 text-slate-600">
          Manage marketplace products, prices, stock,
          pictures and videos.
        </p>

        {message && (
          <div className="mt-5 rounded-xl bg-violet-50 p-4 font-semibold text-violet-700">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-bold">
                Product Name
              </label>

              <input
                type="text"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
                placeholder="e.g. Smartphone"
              />
            </div>

            <div>
              <label className="text-sm font-bold">
                Price (KSh)
              </label>

              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm({
                    ...form,
                    price: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
                placeholder="25000"
              />
            </div>

            <div>
              <label className="text-sm font-bold">
                Stock
              </label>

              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stock: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
                placeholder="10"
              />
            </div>

            <div>
              <label className="text-sm font-bold">
                Product Picture
              </label>

              <label className="mt-2 block cursor-pointer rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 p-5 text-center transition hover:border-violet-500 hover:bg-violet-100">
                <span className="text-3xl">
                  📷
                </span>

                <span className="mt-2 block font-bold text-violet-700">
                  {uploadingImage
                    ? "Uploading picture..."
                    : "Choose JPG/JPEG Picture"}
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  JPG or JPEG • Maximum 10MB
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/jpg,.jpg,.jpeg"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0];

                    if (file) {
                      uploadImage(file);
                    }

                    event.target.value = "";
                  }}
                />
              </label>

              {form.image && (
                <div className="mt-4 overflow-hidden rounded-xl border bg-slate-50">
                  <img
                    src={form.image}
                    alt="Product preview"
                    className="h-48 w-full object-cover"
                  />

                  <div className="flex items-center justify-between p-3">
                    <span className="truncate text-xs font-semibold text-green-600">
                      ✓ Picture uploaded
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          image: "",
                        })
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-bold">
              Description
            </label>

            <textarea
              required
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border px-4 py-3"
              rows={4}
              placeholder="Describe the product..."
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={uploadingImage}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-black text-white disabled:opacity-50"
            >
              {editingId
                ? "Update Product"
                : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-6 py-3 font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-10">
          <h3 className="text-2xl font-black">
            Products
          </h3>

          {loading ? (
            <p className="mt-5 text-slate-600">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <div className="mt-5 rounded-xl bg-white p-8 text-center shadow">
              No products have been added yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-violet-100 to-cyan-100 text-slate-400">
                      <div className="text-center">
                        <span className="text-5xl">
                          📦
                        </span>

                        <p className="mt-2 text-sm font-bold">
                          No image
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <h4 className="text-xl font-black">
                      {product.name}
                    </h4>

                    <p className="mt-2 text-sm text-slate-600">
                      {product.description}
                    </p>

                    <p className="mt-4 text-lg font-black text-violet-600">
                      KSh{" "}
                      {product.price.toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm">
                      Stock:{" "}
                      <span className="font-bold">
                        {product.stock}
                      </span>
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() =>
                          editProduct(product)
                        }
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(product.id)
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mt-6 border-t pt-5">
                      <div className="flex items-center justify-between">
                        <h5 className="font-black">
                          🎥 Product Videos
                        </h5>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                          {(product.videos ?? []).length}
                        </span>
                      </div>

                      <label className="mt-4 block cursor-pointer rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 p-4 text-center transition hover:border-violet-500 hover:bg-violet-100">
                        <span className="font-bold text-violet-700">
                          {uploadingVideo === product.id
                            ? "Uploading..."
                            : "🎬 Upload MP4 Video"}
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                          MP4 • Maximum 100MB
                        </span>

                        <input
                          type="file"
                          accept="video/mp4,.mp4"
                          className="hidden"
                          disabled={
                            uploadingVideo ===
                            product.id
                          }
                          onChange={(event) => {
                            const file =
                              event.target.files?.[0];

                            if (file) {
                              uploadVideo(
                                product.id,
                                file
                              );
                            }

                            event.target.value = "";
                          }}
                        />
                      </label>

                      {(product.videos ?? []).length >
                        0 && (
                        <div className="mt-4 space-y-4">
                          {product.videos.map(
                            (video) => (
                              <div
                                key={video.id}
                                className="overflow-hidden rounded-xl border bg-slate-50"
                              >
                                <video
                                  src={video.url}
                                  controls
                                  preload="metadata"
                                  className="h-40 w-full bg-black object-contain"
                                />

                                <div className="flex items-center justify-between gap-3 p-3">
                                  <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="truncate text-xs font-bold text-violet-600 hover:underline"
                                  >
                                    {video.url}
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteVideo(
                                        product.id,
                                        video.id
                                      )
                                    }
                                    disabled={
                                      deletingVideo ===
                                      video.id
                                    }
                                    className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                                  >
                                    {deletingVideo ===
                                    video.id
                                      ? "..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <a
                      href={`/products/${product.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
                    >
                      View Customer Page →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
